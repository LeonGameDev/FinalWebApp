from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import app, mysql
import time
import os
from werkzeug.utils import secure_filename
from flask import jsonify

# Add this configuration at the top of your file
UPLOAD_FOLDER = 'app/static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'}
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
    
    # Get existing files to potentially delete
    old_files = []
    if note_id:
        cur.execute("SELECT file_url FROM notes WHERE id=%s", (note_id,))
        result = cur.fetchone()
        if result and result[0]:
            old_files = result[0].split(',')
    
    # Process new file uploads
    new_files = []
    total_size = 0
    timestamp = int(time.time())

    for i, file in enumerate(request.files.getlist('file')):
        if file.filename == '':
            continue
            
        if not allowed_file(file.filename):
            continue
            
        if file.content_length > 1024 * 1024:  # 1MB per file
            continue
            
        total_size += file.content_length
        if total_size > 1024 * 1024:  # Total 1MB limit
            break
            
        filename = secure_filename(f"{current_user.id}_{timestamp}_{i}_{file.filename}")
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        new_files.append(filename)
    
    # Combine old and new files (unless we're replacing)
    if note_id and old_files:
        # If we have new uploads, replace old files
        if new_files:
            # Delete old files
            for old_file in old_files:
                try:
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], old_file))
                except Exception as e:
                    app.logger.error(f"Error deleting old file: {e}")
            all_files = new_files
        else:
            # Keep old files if no new uploads
            all_files = old_files
    else:
        all_files = new_files
    
    # Prepare file URLs (comma-separated)
    files_str = ','.join(all_files) if all_files else None
    
    if note_id:  # Update existing note
        cur.execute("""
            UPDATE notes 
            SET title=%s, content=%s, file_url=%s
            WHERE id=%s AND user_id=%s
        """, (title, content, files_str, note_id, current_user.id))
    else:  # Create new note
        timestamp = int(time.time())
        cur.execute("""
            INSERT INTO notes (user_id, title, content, created_at, file_url) 
            VALUES (%s, %s, %s, %s, %s)
        """, (current_user.id, title, content, timestamp, files_str))
    
    mysql.connection.commit()
    note_id = cur.lastrowid if not note_id else note_id
    
    return jsonify({
        "success": True,
        "id": note_id,
        "file_count": len(all_files) if all_files else 0
    })

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
    filename = request.form.get('filename')
    cur = mysql.connection.cursor()
    
    # Get current files
    cur.execute("SELECT file_url FROM notes WHERE id=%s AND user_id=%s", 
               (note_id, current_user.id))
    result = cur.fetchone()
    
    if result and result[0]:
        files = result[0].split(',')
        if filename in files:
            # Remove the file from list
            files.remove(filename)
            new_files = ','.join(files) if files else None
            
            # Delete the physical file
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                app.logger.error(f"Error deleting file: {e}")
            
            # Update the database
            cur.execute("UPDATE notes SET file_url=%s WHERE id=%s AND user_id=%s", 
                       (new_files, note_id, current_user.id))
            mysql.connection.commit()
            
            return jsonify({
                "success": True, 
                "remaining_files": len(files),
                "message": "File removed successfully"
            })
    
    return jsonify({"success": False, "message": "File not found"})

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
