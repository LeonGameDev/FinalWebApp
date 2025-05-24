from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import app, mysql
import time
import os
from werkzeug.utils import secure_filename
from flask import jsonify

# Add this configuration at the top of your file
UPLOAD_FOLDER = 'app/static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB limit

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/note/save', methods=['POST'])
@login_required
def save_note():
    note_id = request.form.get('id')
    title = request.form.get('title')
    content = request.form.get('content')
    
    cur = mysql.connection.cursor()
    
    # Handle file upload
    file_url = None
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{current_user.id}_{int(time.time())}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                file_url = filename
    
    if note_id:  # Update existing note
        if file_url:
            cur.execute("""
                UPDATE notes 
                SET title=%s, content=%s, file_url=%s
                WHERE id=%s AND user_id=%s
            """, (title, content, file_url, note_id, current_user.id))
        else:
            cur.execute("""
                UPDATE notes 
                SET title=%s, content=%s
                WHERE id=%s AND user_id=%s
            """, (title, content, note_id, current_user.id))
        mysql.connection.commit()
        return jsonify({"success": True, "id": note_id})
    else:  # Create new note
        timestamp = int(time.time())
        cur.execute("""
            INSERT INTO notes (user_id, title, content, created_at, file_url) 
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, title, content, timestamp, file_url))
        mysql.connection.commit()
        note_id = cur.lastrowid
        return jsonify({"success": True, "id": note_id})

@app.route('/note/get/<int:note_id>')
@login_required
def get_note(note_id):
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT id, title, content, file_url 
        FROM notes 
        WHERE id=%s AND user_id=%s
    """, (note_id, current_user.id))
    note = cur.fetchone()
    
    if note:
        return jsonify({
            "success": True,
            "note": {
                "id": note[0],
                "title": note[1],
                "content": note[2],
                "file_url": note[3] if note[3] else None
            }
        })
    return jsonify({"success": False})

@app.route('/note/remove_file/<int:note_id>', methods=['POST'])
@login_required
def remove_file(note_id):
    cur = mysql.connection.cursor()
    
    # First get the filename to delete from filesystem
    cur.execute("SELECT file_url FROM notes WHERE id=%s AND user_id=%s", 
               (note_id, current_user.id))
    result = cur.fetchone()
    
    if result and result[0]:
        try:
            # Delete the physical file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], result[0])
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            app.logger.error(f"Error deleting file: {e}")
    
    # Update the database
    cur.execute("UPDATE notes SET file_url=NULL WHERE id=%s AND user_id=%s", 
               (note_id, current_user.id))
    mysql.connection.commit()
    
    return jsonify({"success": True})

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
        cur.execute("""
            UPDATE notes
            SET password_hash = NULL, is_locked = 0
            WHERE id = %s AND user_id = %s
        """, (note_id, current_user.id))
        mysql.connection.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Wrong password"})
