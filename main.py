from flask import Flask, request, redirect, render_template, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from hashutils import *

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://wedding:password@35.197.5.142/wedding' #TODO set for Wedding Planner
#app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://wedding:password@/wedding?unix_socket=/cloudsql/noted-lead-181802:us-west1:wedding-planner'
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)
app.secret_key = "246Pass"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True) #prim key to differentiate users
    name = db.Column(db.String(100))
    username = db.Column(db.String(30))
    phoneNumber = db.Column(db.Integer)
    password = db.Column(db.String(100))

    def __init__(self, username, password):
        self.username = username
        self.password = password

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username'] #get username/pass
        password = request.form['password']
        user=User.query.filter_by(username=username).first() #check if username in use yet
        if username and password:
        #if username in db and pass correct...
            session['username'] = username #starts session
            return render_template('testSignup.html') #TODO where to redirect to?
        elif not user:
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
        # name=request.form['name']
        # phoneNumber=request.form['phoneNumber']
        current_users = User.query.filter_by(username = username).first()
        if password == '':
            flash('Please enter a password', 'error')
            return redirect('/signup')
        if username == '':
            flash('Please enter an email for your username', 'error')
            return redirect('/signup')
        # if name == '':
        #     flash('Please enter your name', 'error')
        #     return redirect('/signup')
        if password != verify:
            flash("Password and verify password don't match", 'error')
            return redirect('/signup')
        if len(password) < 3:
            flash("Password must be at least 3 characters long", 'error')
            return redirect('/signup')
        # if len(str(phoneNumber)) < 10:
        #     flash("Phone number must be 10 digits long (include area code)", 'error')
        #     return redirect('/signup')
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
