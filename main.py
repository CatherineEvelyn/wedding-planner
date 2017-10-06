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
    if request.method == 'POST':
        username = request.form['username'] #get username/pass
        password = request.form['password']
        user=User.query.filter_by(username=username).first() #check if username in use yet
        if username and password:
        #if username in db and pass correct...
            session['username'] = username #starts session
            return render_template('testSignup.html') #TODO where to redirect to?
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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST': #is user signing up
        form = request.form
        username = form['username']
        password = form['password']
        verify = form['verify']
        register_type = 'organizer'

        if 'vendor_signup' in form:
            print("Vendor Signup")
            register_type = 'vendor'

        # XXX Not sure if we need this
        # name=request.form['name']
        # phoneNumber=request.form['phoneNumber']
        # current_users = User.query.filter_by(username = username).first()

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

        if password == '':
            flash('Please enter a password', 'pass_error')
            return redirect('/signup')
        if username == '':
            flash('Please enter an email for your username', 'user_error')
            return redirect('/signup')
        # Check if is valid email
        if not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", username):
            flash("Username must be a valid email", 'user_error')
            return redirect('/signup')
        # Check if passwords match
        if password != verify:
            flash("Password and verify password don't match", 'verify_error')
            return redirect('/signup')
        # Check if password has a minimum length of 8 characters
        if len(password) < 8:
            flash("Password must be at least 8 characters long", 'pass_error')
            return redirect('/signup')
        # Check if contains at least one digit
        if not re.search(r'\d', password):
            flash("Password must contain at least one number", 'pass_error')
            return redirect('/signup')
        # Check if contains at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            flash("Password must contain at least one uppercase letter.", 'pass_error')
            return redirect('/signup')
        # Check if contains at least one lowercase letter
        if not re.search(r'[a-z]', password):
            flash("Password must contain at least one lowercase letter.", 'pass_error')
            return redirect('/signup')

        # TODO This is basic, needs to expand to what the coulmns actually are
        if register_type == 'organizer':
            new_user = User(username, password)
            
        print(register_type)
        # db.session.add(new_user)
        # db.session.commit()
        session['username'] = username
        # Create a login function to auto login the user based on register_type (vendor/organizer)
        return render_template('verify_email.html')

    return render_template('signup.html')

if __name__ == '__main__': #run app
    app.run()
