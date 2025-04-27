from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import app, mysql
import time

@app.route('/note/new', methods=['GET', 'POST'])
@login_required
def new_note():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        timestamp = int(time.time())

        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO notes (user_id, title, content, created_at) VALUES (%s, %s, %s, %s)",
                    (current_user.id, title, content, timestamp))
        mysql.connection.commit()
        return redirect(url_for('home'))
    return render_template('note_form.html', note=None)

@app.route('/note/edit/<int:note_id>', methods=['GET', 'POST'])
@login_required
def edit_note(note_id):
    cur = mysql.connection.cursor()
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        cur.execute("UPDATE notes SET title=%s, content=%s WHERE id=%s AND user_id=%s",
                    (title, content, note_id, current_user.id))
        mysql.connection.commit()
        return redirect(url_for('home'))

    cur.execute("SELECT id, title, content FROM notes WHERE id=%s AND user_id=%s", (note_id, current_user.id))
    note = cur.fetchone()
    return render_template('note_form.html', note=note)

@app.route('/note/delete/<int:note_id>')
@login_required
def delete_note(note_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM notes WHERE id=%s AND user_id=%s", (note_id, current_user.id))
    mysql.connection.commit()
    return redirect(url_for('home'))

from flask import request, jsonify
import bcrypt

@app.route('/note/lock/<int:note_id>', methods=['POST'])
@login_required
def lock_note(note_id):
    data = request.get_json()
    password = data.get('password')

    if not password:
        return jsonify({"success": False, "message": "No password provided"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE notes
        SET password_hash = %s, is_locked = 1
        WHERE id = %s AND user_id = %s
    """, (hashed_password, note_id, current_user.id))
    mysql.connection.commit()

    return jsonify({"success": True})

@app.route('/note/unlock/<int:note_id>', methods=['POST'])
@login_required
def unlock_note(note_id):
    data = request.get_json()
    password = data.get('password')
    if not password:
        return jsonify({"success": False, "message": "No password provided"})

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT password_hash
        FROM notes
        WHERE id = %s AND user_id = %s
    """, (note_id, current_user.id))
    result = cur.fetchone()

    if not result or not result[0]:
        return jsonify({"success": False, "message": "Note not locked or not found."})

    stored_hash = result[0].encode('utf-8')

    if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Wrong password"})
