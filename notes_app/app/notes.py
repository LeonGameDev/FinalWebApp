from flask import render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import app, mysql
from datetime import datetime
import requests
import time

@app.route('/note/new', methods=['GET', 'POST'])
@login_required
def new_note():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']

        try:
            # Fetch the current time from TimeAPI
            response = requests.get("https://timeapi.io/api/Time/current/zone?timeZone=UTC", timeout=10)
            response.raise_for_status()
            time_data = response.json()
            # Convert the datetime string to a datetime object
            api_time = datetime.fromisoformat(time_data["dateTime"])
            # Convert the datetime object to a Unix timestamp
            timestamp = int(api_time.timestamp())
        except (requests.exceptions.RequestException, ValueError):
            print("Offline!")
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
