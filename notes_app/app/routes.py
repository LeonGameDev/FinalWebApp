from app import app
from flask import render_template

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

import uuid
from flask import render_template, request, redirect, url_for, flash
from app import app, mysql, bcrypt, mail
from flask_mail import Message

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form['email']
        display_name = request.form['display_name']
        password = request.form['password']
        confirm = request.form['confirm_password']

        # Check password match
        if password != confirm:
            flash("Passwords do not match.", "danger")
            return redirect(url_for('register'))

        cur = mysql.connection.cursor()

        # Check if email already exists
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            flash("Email already exists.", "danger")
            return redirect(url_for('register'))

        # Check if display name already exists
        cur.execute("SELECT id FROM users WHERE display_name=%s", (display_name,))
        if cur.fetchone():
            flash("Display name already taken.", "danger")
            return redirect(url_for('register'))

        # All good — save the user
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        token = str(uuid.uuid4())

        cur.execute("""
            INSERT INTO users (email, display_name, password, verification_token)
            VALUES (%s, %s, %s, %s)
        """, (email, display_name, hashed_pw, token))
        mysql.connection.commit()

        # Send verification email
        msg = Message('Verify Your Account',
                      sender='your.email@gmail.com',
                      recipients=[email])
        link = request.host_url + 'verify/' + token
        msg.body = f'Click the link to verify your account: {link}'
        mail.send(msg)

        flash("Check your email to verify your account.", "info")
        return redirect(url_for('register'))

    return render_template('register.html')

from flask_login import login_user
from app.models import User

@app.route('/verify/<token>')
def verify(token):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE verification_token = %s", (token,))
    user_data = cur.fetchone()

    if user_data:
        cur.execute("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = %s", (user_data[0],))
        mysql.connection.commit()

        user = User(*user_data)
        login_user(user)

        return render_template("verified.html", success=True)
    else:
        return render_template("verified.html", success=False)

from flask_login import login_user, logout_user, login_required, current_user
from app.models import User

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        result = cur.fetchone()
        if result:
            user = User(*result)
            if bcrypt.check_password_hash(user.password, password):
                login_user(user)
                return redirect(url_for('home'))
            else:
                flash('Incorrect password.', 'danger')
        else:
            flash('Email not found.', 'danger')

        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/home')
@login_required
def home():
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT id, title, content, color, pinned, is_locked, created_at
        FROM notes
        WHERE user_id = %s
        ORDER BY pinned DESC, id DESC
    """, (current_user.id,))
    user_notes = cur.fetchall()
    return render_template('notes.html', notes=user_notes)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

import uuid

@app.route('/reset', methods=['GET', 'POST'])
def reset_request():
    message = ''
    if request.method == 'POST':
        email = request.form['email']
        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        result = cur.fetchone()
        if result:
            token = str(uuid.uuid4())
            cur.execute("UPDATE users SET verification_token = %s WHERE id = %s", (token, result[0]))
            mysql.connection.commit()

            msg = Message("Password Reset",
                          sender="your.email@gmail.com",
                          recipients=[email])
            reset_link = request.host_url + 'reset/' + token
            msg.body = f'Click to reset your password: {reset_link}'
            mail.send(msg)

            flash("Reset link sent. Check your email.", "info")
        else:
            flash("Email not found.", "danger")
        return redirect(url_for('reset_request'))
    return render_template('reset_request.html', message=message)

@app.route('/reset/<token>', methods=['GET', 'POST'])
def reset_password(token):
    message = ''
    if request.method == 'POST':
        password = request.form['password']
        confirm = request.form['confirm_password']
        if password != confirm:
            flash("Passwords do not match.", "danger")
        else:
            hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
            cur = mysql.connection.cursor()
            cur.execute("UPDATE users SET password = %s, verification_token = NULL WHERE verification_token = %s",
                        (hashed_pw, token))
            mysql.connection.commit()
            flash("Your password has been reset. You can now log in.", "success")
            return redirect(url_for('login'))

    return render_template('reset_password.html', message=message)

from flask import jsonify

@app.route('/is_verified')
def is_verified():
    email = request.args.get('email')
    cur = mysql.connection.cursor()
    cur.execute("SELECT is_verified FROM users WHERE email = %s", (email,))
    result = cur.fetchone()
    if result and result[0] == 1:
        return jsonify({'verified': True})
    return jsonify({'verified': False})

@app.route('/note/color/<int:note_id>', methods=['POST'])
@login_required
def update_note_color(note_id):
    data = request.get_json()
    color = data.get('color')
    theme = data.get('theme')

    # Treat default theme colors as None
    if (theme == "light" and color.lower() == "#ffffff") or (theme == "dark" and color.lower() == "#000000"):
        color = None

    cur = mysql.connection.cursor()
    cur.execute("UPDATE notes SET color = %s WHERE id = %s AND user_id = %s", (color, note_id, current_user.id))
    mysql.connection.commit()
    return jsonify({"success": True})

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    message = ''
    if request.method == 'POST':
        new_name = request.form['display_name']
        cur = mysql.connection.cursor()
        cur.execute("UPDATE users SET display_name = %s WHERE id = %s", (new_name, current_user.id))
        mysql.connection.commit()
        flash("Display name updated!", "success")
        return redirect(url_for('profile'))

    return render_template('profile.html')

@app.route('/note/pin/<int:note_id>', methods=['POST'])
@login_required
def toggle_pin(note_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT pinned FROM notes WHERE id = %s AND user_id = %s", (note_id, current_user.id))
    result = cur.fetchone()
    if result:
        new_status = not result[0]
        cur.execute("UPDATE notes SET pinned = %s WHERE id = %s", (new_status, note_id))
        mysql.connection.commit()
        return jsonify({"success": True, "pinned": new_status})
    return jsonify({"success": False})
