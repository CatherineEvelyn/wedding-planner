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

user_vendor = db.Table('user_vendor',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('vendor_id', db.Integer, db.ForeignKey('vendors.id'))
    )

class Vendor(db.Model):
    __tablename__ = 'vendors'
    id = db.Column(db.Integer, primary_key=True) #prim key to differentiate vendors
    businessName = db.Column(db.String(100))
    contactName = db.Column(db.String(50))
    email = db.Column(db.String(50))
    streetAddress = db.Column(db.String(100))
    city = db.Column(db.String(50))
    zipcode = db.Column(db.Integer)
    rating = db.Column(db.Float)
    vendorType = db.Column(db.String(50))
    priceMin = db.Column(db.Integer)
    priceMax = db.Column(db.Integer)
    password = db.Column(db.String(100))

    #children = db.relationship("User", secondary=user_vendor)

    def __init__(self, email, businessName, contactName, streetAddress, city, zipcode, rating, vendorType, priceMin, priceMax, password):
        self.businessName = businessName
        self.contactName = contactName
        self.email = email
        self.streetAddress = streetAddress
        self.city = city
        self.zipcode = zipcode
        self.rating = rating
        self.vendorType = vendorType
        self.priceMin = priceMin
        self.priceMax = priceMax
        self.password = password


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True) #prim key to differentiate users
    name = db.Column(db.String(100))
    username = db.Column(db.String(30))
    phoneNumber = db.Column(db.Integer)
    password = db.Column(db.String(100))
    userVendors = db.relationship('Vendor', secondary=user_vendor, backref='user')

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
        register_type = 'organizer'

        if 'vendor_signup' in form:
            print("Vendor Signup")
            register_type = 'vendor'

        # XXX Not sure if we need this
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

        # TODO This is basic, needs to expand to what the coulmns actually are
        if register_type == 'organizer':
            new_user = User(username, password)

        print(register_type)
        if not usererrors and not passerrors and not verifyerrors:
            new_user=User(username, password)
            db.session.add(new_user)
            db.session.commit()
            session['username'] = username
            return render_template('verify_email.html')

        return render_template('signup.html', errors=errors, username=username)
            

    return render_template('signup.html', errors=errors)

if __name__ == '__main__': #run app
    app.run()
