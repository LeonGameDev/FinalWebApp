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

    message = ''
    email = ''
    if request.method == 'POST':
        email = request.form['email']
        display_name = request.form['display_name']
        password = request.form['password']
        confirm = request.form['confirm_password']
        
        if password != confirm:
            message = 'Passwords do not match.'
            return render_template('register.html', message=message)
        
        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        token = str(uuid.uuid4())

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            message = 'Email already exists.'
        else:
            cur.execute("INSERT INTO users (email, display_name, password, verification_token) VALUES (%s, %s, %s, %s)",
                        (email, display_name, hashed_pw, token))
            mysql.connection.commit()

            # Send verification email
            msg = Message('Verify Your Account',
                          sender='your.email@gmail.com',
                          recipients=[email])
            link = request.host_url + 'verify/' + token
            msg.body = f'Click the link to verify your account: {link}'
            mail.send(msg)

            flash("Check your email to verify your account.", "info")
            return  redirect(url_for('register', email = email))
        
    return render_template('register.html', message=message, registered_email=email)

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
    cur.execute("SELECT id, title, content FROM notes WHERE user_id = %s", (current_user.id,))
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
        confirm = request.form['confirm']
        if password != confirm:
            message = 'Passwords do not match.'
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
