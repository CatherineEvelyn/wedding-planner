from flask import Flask, request, redirect, render_template, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from hashutils import *

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://wedding:password!@localhost:8889/wedding' #TODO set for Wedding Planner
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)
app.secret_key = "246Pass"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True) #prim key to differentiate users
    username = db.Column(db.String(30))
    password = db.Column(db.String(100))

    def __init__(self, username, password):
        self.username = username
        self.password = password

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username'] #get username/pass
        password = request.form['password']
        user=User.query.filter_by(username=username).first() #check if username in use yet
        if username and password:
        #if username in db and pass correct...
            session['username'] = username #starts session
            return redirect('/') #TODO where to redirect to?
        elif not username:
            flash("Username not yet registered", 'error')
            return redirect('/login')
        else:
            flash('Incorrect password', 'error')
            return redirect('/login')

    return render_template('login.html')

"""@app.route('/logout')
def logout():
    del session['username']
    return redirect('/')
"""

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST': #is user signing up
        username=request.form['username']
        password=request.form['password']
        verify=request.form['verify']
        current_users = User.query.filter_by(username = username).first()
        if password == '':
            flash('Please enter a password', 'error')
            return redirect('/signup')
        if username == '':
            flash('Please enter a username', 'error')
            return redirect('/signup')
        if password != verify:
            flash("Password and verify password don't match", 'error')
            return redirect('/signup')
        if len(password) < 3:
            flash("Password must be at least 3 characters long", 'error')
            return redirect('/signup')
        if len(username) < 3:
            flash("Password must be at least 3 characters long", 'error')
            return redirect('/signup')
        if current_users != None:
            if username in current_users:
                flash("Duplicate user", 'error')
                return redirect('/signup')
        else:
            new_user=User(username, password)
            db.session.add(new_user)
            db.session.commit()
            session['username'] = username
            return render_template('testSignup.html')


    return render_template('signup.html')

if __name__ == '__main__': #run app
    app.run()
