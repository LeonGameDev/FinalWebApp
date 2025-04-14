from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import app, mysql

@app.route('/note/new', methods=['GET', 'POST'])
@login_required
def new_note():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO notes (user_id, title, content) VALUES (%s, %s, %s)",
                    (current_user.id, title, content))
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
