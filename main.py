from flask import Flask, request, redirect, render_template, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from hashutils import *
import re
#from faker import Faker
import random
from sqlalchemy import create_engine
engine = create_engine('sqlite:///association_tables.sqlite')

from sqlalchemy.orm import sessionmaker
#session = sessionmaker()
#session.configure(bind=engine)

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://wedding:password@35.197.5.142/wedding' #TODO set for Wedding Planner
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)
app.secret_key = "246Pass"

class UserVendor(db.Model):
    __tablename__ = 'user_vendor'
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    eventDate = db.Column(db.Date)
    eventStartTime = db.Column(db.Time)
    eventEndTime = db.Column(db.Time)
    vendor = db.relationship('Vendor', backref="user_assoc")
    user = db.relationship('User', backref="vendor_assoc")

    def __init__(self, vendor_id, user_id, eventDate, eventStartTime, eventEndTime):
        self.vendor_id = vendor_id
        self.user_id = user_id
        self.eventDate = eventDate
        self.eventStartTime = eventStartTime
        self.eventEndTime = eventEndTime


class Vendor(db.Model):
    __tablename__ = 'vendor'
    id = db.Column(db.Integer, primary_key=True)
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
    state = db.Column(db.String(2))
    users = db.relationship(
        'User',
        secondary='user_vendor'
    )


    def __init__(self, email, businessName, contactName, streetAddress, city, zipcode, rating, vendorType, priceMin, priceMax, password, state):
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
        self.state = state

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(30))
    phoneNumber = db.Column(db.Integer)
    password = db.Column(db.String(100))
    numberOfGuests = db.Column(db.Integer)
    eventDate = db.Column(db.Date)
    vendors = db.relationship(
        'Vendor',
        secondary='user_vendor'
    )

    def __init__(self, email, password):
        self.email = email
        self.password = password

@app.route('/login', methods=['GET', 'POST'])
def login():
    usererrors, passerrors, verifyerrors = [], [], []
    errors = {'usererrors': usererrors,
              'passerrors': passerrors} # initializing errors object

    if request.method == 'POST':
        email = request.form['email'] #get email/pass
        password = request.form['password']
        user = User.query.filter_by(email=email).first() # check if email in use yet
        vendor = Vendor.query.filter_by(email=email).first()

        if email == '':
            usererrors.append("This field cannot be left blank.")
        if password == '':
            passerrors.append("This field cannot be left blank.")

        if user:
            if not check_pw_hash(password, user.password):
                passerrors.append("That password is incorrect.")
            else:
                session['email'] = email #starts session
                return redirect('organizer')
        elif vendor:
            if not check_pw_hash(password, vendor.password):
                passerrors.append("That password is incorrect.")
            else:
                session['email'] = email #starts session
                return redirect('profile')
        else:
            usererrors.append("That user doesn't exist.")

        return render_template('login.html', errors=errors, email=email)
    return render_template('login.html', errors=errors)

@app.route('/logout')
def logout():
    del session['email']
    return redirect('/')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/profile')
def profile():
    
    return render_template("vendor-account.html")

@app.route('/organizer')
def organizer():
    return render_template("user-account.html")

@app.route('/book', methods=['POST', 'GET'])
def book():
    if request.method == "GET":
        return render_template("book.html")
    if request.method == "POST":
        vendor =Vendor.query.filter_by(email="TestVendor@email.com").first()
        users = User.query.filter_by(email="kristen.l.sharkey@gmail.com").first()
        vendor_id = 1
        users_id = 1
        eventDate = request.form["eventDate"]
        eventStartTime = request.form["eventStartTime"]
        eventEndTime = request.form["eventEndTime"]
        new_Booking = UserVendor(users_id, vendor_id, eventDate, eventStartTime, eventEndTime)
        db.session.add(new_Booking)
        db.session.commit()
        return redirect("/")

@app.route('/vendor-list')
def vendorList():
    return render_template('vendor-list.html')

# AJAX call to return data from the DB as a json array
@app.route('/vendor')
def vendor():
    vendor_type = request.args.get("type")
    query = Vendor.query.filter_by(vendorType=vendor_type)
    vendors = []
    for vendor in query:
        vendors.append({
            "id": vendor.id,
            "businessName": vendor.businessName,
            "contactName": vendor.contactName,
            "email":vendor.email,
            "streetAddress": vendor.streetAddress,
            "city": vendor.city,
            "zipcode": vendor.zipcode,
            "rating": vendor.rating,
            "vendorType": vendor.vendorType,
            "prinMin": vendor.priceMin,
            "priceMax": vendor.priceMax
        })
    return jsonify(type=vendor_type, vendors=vendors)
    # return jsonify({"type": vendor_type, "vendors": vendors})

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    (u_usererrors, u_passerrors, u_verifyerrors, 
    v_usererrors, v_passerrors, v_verifyerrors,
    nameerrors, businesserrors, vendortypeerrors, 
    addresserrors, zipcodeerrors, priceminerrors, 
    pricemaxerrors)  = ([], [], [], [], [], [], [], [], [], [], [], [], [])

    errors = {'u_usererrors': u_usererrors,
              'u_passerrors': u_passerrors,
              'u_verifyerrors': u_verifyerrors,
              'v_usererrors': v_usererrors,
              'v_passerrors': v_passerrors,
              'v_verifyerrors': v_verifyerrors,
              'nameerrors': nameerrors,
              'businesserrors': businesserrors,
              'vendortypeerrors': vendortypeerrors,
              'addresserrors': addresserrors,
              'zipcodeerrors': zipcodeerrors,
              'priceminerrors': priceminerrors,
              'pricemaxerrors': pricemaxerrors} # initializing errors object

    if request.method == 'POST': #is user signing up
        form = request.form
        email = form['email']
        password = form['password']
        verify = form['verify']

        register_type = 'organizer'

        # XXX Not sure if we need this
        # name=request.form['name']
        # phoneNumber=request.form['phoneNumber']
        # current_users = User.query.filter_by(email=email).first()

        if 'organizer_signup' in form:
            if not email:
                u_usererrors.append('This field cannot be left blank.')
            # Check if is valid email
            elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
                u_usererrors.append('Must be a valid email.')

            if not password:
                u_passerrors.append('This field cannot be left blank.')
            else:
                # Check if password has a minimum length of 8 characters
                if len(password) < 8:
                    u_passerrors.append("Password must be at least 8 characters long.")
                # Check if contains at least one digit
                if not re.search(r'\d', password):
                    u_passerrors.append("Password must contain at least one number.")
                # Check if contains at least one uppercase letter
                if not re.search(r'[A-Z]', password):
                    u_passerrors.append("Password must contain at least one uppercase letter.")
                # Check if contains at least one lowercase letter
                if not re.search(r'[a-z]', password):
                    u_passerrors.append("Password must contain at least one lowercase letter.")

            if password != verify:
                u_verifyerrors.append("Your passwords don't match.")

        # Vendor signup verification
        if 'vendor_signup' in form:
            print("Vendor Signup")
            register_type = 'vendor'
            name = form['name']
            business_name = form['business']
            vendor_type = form['vendortype']
            street_address = form['address']
            # city = form['city']
            state = form['state']
            zipcode = form['zipcode']
            price_min = form['pricemin']
            price_max = form['pricemax']

            if not name:
                nameerrors.append("This field cannot be left blank.")
            elif name.isdigit():
                nameerrors.append("Your name cannot contain numbers.")

            if not business_name:
                businesserrors.append("This field cannot be left blank.")

            if not vendor_type:
                vendortypeerrors.append("Please select a vendor type.")
            
            if not street_address:
                addresserrors.append("This field cannot be left blank.")

            if not zipcode:
                zipcodeerrors.append("This field cannot be left blank.")
            elif zipcode.isalpha():
                zipcodeerrors.append("That is not a valid zipcode.")

            if not price_min:
                priceminerrors.append("This field cannot be left blank.")
            elif price_min.isalpha():
                priceminerrors.append("Minimum price must be a number.")

            if not price_max:
                pricemaxerrors.append("This field cannot be left blank.")
            elif price_min.isalpha():
                pricemaxerrors.append("Maximum price must be a number.")

        if not any([u_usererrors, u_passerrors, u_verifyerrors, v_usererrors, v_passerrors, v_verifyerrors]):
            # Register new organizer, or vendor
            if register_type == 'organizer':
                user = User.query.filter_by(email=email).first()
                # Check if email already exists
                if not user:
                    # Hash the password before sending to DB
                    new_user = User(email, make_pw_hash(password))
                    db.session.add(new_user)
                    db.session.commit()
                    session['email'] = email
                    return render_template('confirmation-page.html')
                else:
                    u_usererrors.append("Email is already in use.")
            else:
                vendor = Vendor.query.filter_by(email=email).first()
                # Check if email already exists
                if not vendor:
                    # Hash the password before sending to DB#
                    # TODO add the rest of the vendor fields
                    new_vendor = Vendor(
                        email, 
                        business_name, 
                        name, 
                        street_address, 
                        None, 
                        zipcode, 
                        None, 
                        vendor_type, 
                        price_min, 
                        price_max, 
                        make_pw_hash(password), 
                        state
                    )
                    db.session.add(new_vendor)
                    db.session.commit()
                    session['email'] = email
                    return render_template('confirmation-page.html')
                else:
                    v_usererrors.append("Email is already in use.")

        # If method == post
        return render_template('signup.html', errors=errors, email=email, type=register_type)
    # method == get
    return render_template('signup.html', errors=errors, type="organizer")


# FOR TESTING PURPOSES ONLY
'''@app.route('/gendata')
def genData():
  vendorTypes = ['venue', 'photographer', 'videographer', 'caterer', 'music', 'cosmetics', 'tailor']
  fake = Faker()
  for i in range(5):
    user = User(
      fake.email(),
      fake.password(length=10, digits=True, upper_case=True, lower_case=True)
    )
    vendor = Vendor(
      fake.email(),
      fake.company(),
      fake.name(),
      fake.street_address(),
      fake.city(),
      fake.zipcode(),
      random.randrange(1, 6),
      random.choice(vendorTypes),
      random.randrange(1, 101),
      random.randrange(101, 501),
      fake.password(length=10, digits=True, upper_case=True, lower_case=True)
    )
    db.session.add(user)
    db.session.add(vendor)
    db.session.commit()
  return redirect('/') 
# END TESTING #
'''
if __name__ == '__main__': #run app
    app.run()
