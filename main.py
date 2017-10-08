from flask import Flask, request, redirect, render_template, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from hashutils import *
import re


app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://wedding:password@35.197.5.142/wedding' #TODO set for Wedding Planner
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
    usererrors, passerrors, verifyerrors = [], [], []
    errors = {'usererrors': usererrors,
              'passerrors': passerrors} # initializing errors object

    if request.method == 'POST':
        username = request.form['username'] #get username/pass
        password = request.form['password']
        user=User.query.filter_by(username=username).first() #check if username in use yet
        if not username:
            usererrors.append("This field cannot be left blank.")
        if not password:
            passerrors.append("This field cannot be left blank.")
        elif user and password != user.password:
            passerrors.append("That password is incorrect.")

        if username and password and not user:
            usererrors.append("That user doesn't exist.")

        if user:
            #if username in db and pass correct...
            session['username'] = username #starts session
            return render_template('testSignup.html') #TODO where to redirect to?

        return render_template('login.html', errors=errors, username=username)

    return render_template('login.html', errors=errors)

"""@app.route('/logout')
def logout():
    del session['username']
    return redirect('/')
"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    usererrors, passerrors, verifyerrors = [], [], []
    errors = {'usererrors': usererrors,
              'passerrors': passerrors,
              'verifyerrors': verifyerrors} # initializing errors object

    if request.method == 'POST': #is user signing up
        form = request.form
        username=form['username']
        password=form['password']
        verify=form['verify']
        # name=request.form['name']
        # phoneNumber=request.form['phoneNumber']
        # current_users = User.query.filter_by(username = username).first()

        if not username:
            usererrors.append('This field cannot be left blank.')
        # Check if is valid email
        elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", username):
            usererrors.append('Username must be a valid email.')

        if not password:
            passerrors.append('This field cannot be left blank.')
        else:
            # Check if password has a minimum length of 8 characters
            if len(password) < 8:
                passerrors.append("Password must be at least 8 characters long.")
            # Check if contains at least one digit
            if not re.search(r'\d', password):
                passerrors.append("Password must contain at least one number.")
            # Check if contains at least one uppercase letter
            if not re.search(r'[A-Z]', password):
                passerrors.append("Password must contain at least one uppercase letter.")
            # Check if contains at least one lowercase letter
            if not re.search(r'[a-z]', password):
                passerrors.append("Password must contain at least one lowercase letter.")

        if password != verify:
            verifyerrors.append("Your passwords don't match.")
        # if name == '':
        #     flash('Please enter your name', 'error')
        #     return redirect('/signup')
        # if len(str(phoneNumber)) < 10:
        #     flash("Phone number must be 10 digits long (include area code)", 'error')
        #     return redirect('/signup')
        # if current_users != None:
        #     if username in current_users:
        #         flash("Duplicate user", 'error')
        #         return redirect('/signup')
        if not usererrors and not passerrors and not verifyerrors:
            new_user=User(username, password)
            db.session.add(new_user)
            db.session.commit()
            session['username'] = username
            return render_template('testSignup.html')

        return render_template('signup.html', errors=errors, username=username)

    return render_template('signup.html', errors=errors)

if __name__ == '__main__': #run app
    app.run()
