from flask import Flask, request, redirect, render_template, url_for, session, flash, jsonify, Markup, abort
from flask_sqlalchemy import SQLAlchemy
from whitenoise import WhiteNoise
from hashutils import *
import re
from faker import Faker
import random
import sys
from datetime import datetime
from sqlalchemy import create_engine
from globals import statelist, typelist
import os

engine = create_engine('sqlite:///association_tables.sqlite')

from sqlalchemy.orm import sessionmaker
#session = sessionmaker()
#session.configure(bind=engine)

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", 'mysql+pymysql://admin:Password1@wedding-planner.cl1lubxzpscn.us-east-2.rds.amazonaws.com/wedplan')
app.config['SQLALCHEMY_ECHO'] = True
db = SQLAlchemy(app)
app.secret_key = "246Pass"

app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/')

EXTERNAL_VENDOR_IDS = [1, 2, 3, 4, 5, 6, 7]
VENDOR_TYPES = {"venue": 1,
                "photographer": 2,
                "videographer": 3,
                "caterer": 4,
                "music": 5,
                "cosmetics": 6,
                "tailor": 7}

class UserVendor(db.Model):
    __tablename__ = 'user_vendor'
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id')) # primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id')) # primary_key=True)
    bookedDate = db.Column(db.Date)
    eventStartTime = db.Column(db.Time)
    eventEndTime = db.Column(db.Time)
    enabled = db.Column(db.Boolean, default = True)
    vendor = db.relationship('Vendor', backref="user_assoc")
    user = db.relationship('User', backref="vendor_assoc")

    def __init__(self, vendor_id, user_id, bookedDate, eventStartTime, eventEndTime, enabled):
        self.vendor_id = vendor_id
        self.user_id = user_id
        self.bookedDate = bookedDate
        self.eventStartTime = eventStartTime
        self.eventEndTime = eventEndTime
        self.enabled = True


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
    price = db.Column(db.BIGINT)
    password = db.Column(db.String(100))
    state = db.Column(db.String(2))
    users = db.relationship(
        'User',
        secondary='user_vendor'
    )


    def __init__(self, email, businessName, contactName, streetAddress, city, zipcode, rating, vendorType, price, password, state):
        self.businessName = businessName
        self.contactName = contactName
        self.email = email
        self.streetAddress = streetAddress
        self.city = city
        self.zipcode = zipcode
        self.rating = rating
        self.vendorType = vendorType
        self.price = price
        self.password = password
        self.state = state

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(50))
    phoneNumber = db.Column(db.BIGINT)
    password = db.Column(db.String(100))
    numberOfGuests = db.Column(db.Integer)
    eventDate = db.Column(db.Date)
    budget = db.Column(db.BIGINT)
    totalSpending = db.Column(db.BIGINT)
    vendors = db.relationship(
        'Vendor',
        secondary='user_vendor'
    )

    def __init__(self, name, email, password):
        self.name = name
        self.email = email
        self.password = password

@app.before_request
def require_login():
    blacklist = ['user', 'profile', 'book']
    if all([request.endpoint in blacklist, 'email' not in session, '/static/' not in request.path]):
        message = Markup("You must to be <strong>logged in</strong> to access this page.")
        flash(message, "is-danger")
        return redirect(url_for('login', next=request.endpoint))

def bad_request(message):
    response = jsonify({'message': message})
    response.status_code = 401
    return response

@app.route('/session')
def getUserSessionDetails():
    if session.get('email', False):
        details = {}
        user_email = session['email']

        # Check if person in session is a normal user
        user = User.query.filter_by(email=user_email).first()

        if user:
            user_name = user.name
            user_type = "user"
        else:
            # Check if they're a vendor
            vendor = Vendor.query.filter_by(email=user_email).first()
            user_name = vendor.contactName
            user_type = "vendor"

        details['user_email'] = user_email
        details['user_name'] = user_name
        details['user_type'] = user_type

        # Check if the source of the request is an ajax call
        if request.args.get("source") == "ajax":
          return jsonify(details)

        return details
    if request.args.get("source") == "ajax":
      return jsonify(session=False)

    return False

def redirect_dest(fallback):
    dest = request.args.get('next')
    try:
        dest_url = url_for(dest)
    except:
        return redirect(fallback)
    print(dest_url)
    return redirect(dest_url)

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Don't want users to be able to log in twice
    if session.get('email', False):
        return redirect(session['url'])

    (usererrors, passerrors, verifyerrors) = ([], [], [])
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
                session['userType'] = "user"
                session['name'] = user.name
                session['userID'] = user.id
                return redirect_dest(fallback=url_for('index'))
        elif vendor:
            if not check_pw_hash(password, vendor.password):
                passerrors.append("That password is incorrect.")
            else:
                session['email'] = email #starts session
                session['userType'] = "vendor"
                session['name'] = vendor.contactName
                session['userID'] = vendor.id
                return redirect_dest(fallback=url_for('index'))
        else:
            usererrors.append("That user doesn't exist.")

        return render_template('login.html', errors=errors, email=email)
    return render_template('login.html', errors=errors)

@app.route('/logout')
def logout():
    if not session.get('email'):
        return redirect(session['url'])
    del session['email']
    del session['userType']
    del session['name']
    del session['userID']
    return redirect('/')

@app.route('/')
def index():
    session['url'] = request.path
    return render_template('index.html')

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if session['userType'] == "user":
        flash("You do not have permission to visit that page.", "is-danger")
        return redirect(session['url'])

    session['url'] = request.path

    vendor = Vendor.query.filter_by(email=session["email"]).first() #get vendor in session

    if request.method == 'POST':
        form = request.form

        name = form['name']
        business_name = form['businessName']
        address = form['streetAddress']
        city = form['city']
        state = form['state']
        zipcode = form['zipcode']

        if name:
            vendor.contactName = name

        if business_name:
            vendor.businessName = business_name

        if address:
            vendor.streetAddress = address

        if city:
            vendor.city = city

        if zipcode:
            vendor.zipcode = zipcode

        db.session.commit()

    if request.args.get("source") == "ajax":
        result = UserVendor.query.join(User, UserVendor.user_id == User.id).add_columns(UserVendor.id, UserVendor.user_id, UserVendor.vendor_id, UserVendor.bookedDate, UserVendor.eventStartTime, UserVendor.eventEndTime, User.name, User.email).filter(UserVendor.vendor_id == vendor.id).order_by(UserVendor.bookedDate)
        userInfo = []

        for row in result:
            userInfo.append({
                "id": row.id,
                "vendorID": row.vendor_id,
                "userID": row.user_id,
                "bookedDate": row.bookedDate.isoformat(),
                "eventStartTime": row.eventStartTime.isoformat(),
                "eventEndTime": row.eventStartTime.isoformat(),
                "userName": row.name,
                "userEmail": row.email
            })

        return jsonify(userInfo)

    return render_template("vendor-account.html", vendor=vendor, statelist=statelist, typelist=typelist)



@app.route('/cancel/vendor/<int:vendor_id>')
def cancel(vendor_id):
    user = User.query.filter_by(email=session["email"]).first()
    booking = UserVendor.query.filter_by(user_id=user.id, vendor_id=vendor_id).first()
    #booking = UserVendor.query.get(booking_id)

    if booking is not None:
       booking.enabled = False
       db.session.add(booking)
       db.session.commit()

    return redirect("user-account")

@app.route('/user-account', methods=['GET', 'POST'])
def organizer():
    if session['userType'] == "vendor":
        flash("You do not have permission to visit that page.", "is-danger")
        return redirect(session['url'])

    session['url'] = request.path

    user = User.query.filter_by(email=session["email"]).first()

    result = UserVendor.query.join(Vendor, UserVendor.vendor_id == Vendor.id).\
             add_columns(
                UserVendor.id,
                UserVendor.user_id,
                UserVendor.vendor_id, 
                UserVendor.bookedDate, 
                UserVendor.eventStartTime, 
                UserVendor.eventEndTime, 
                Vendor.contactName, 
                Vendor.email,
                Vendor.businessName,
                Vendor.price,
                Vendor.vendorType).\
             filter(UserVendor.user_id == user.id, UserVendor.enabled == 1).\
             order_by(UserVendor.bookedDate)

    venue = []
    photographer = []
    videographer= []
    caterer = []
    music = []
    cosmetics = []
    tailor = []
    greenStatus = "is-selected"

    for row in result:
        if row.vendorType == "venue":
            venue.append(row)
        elif row.vendorType == "photographer":
            photographer.append(row)
        elif row.vendorType == "videographer":
            videographer.append(row)
        elif row.vendorType == "caterer":
            caterer.append(row)
        elif row.vendorType == "music":
            music.append(row)
        elif row.vendorType == "cosmetics":
            cosmetics.append(row)
        elif row.vendorType == "tailor":
            tailor.append(row)

    return render_template("user-account.html", venue=venue,
                                                photographer=photographer,
                                                videographer=videographer,
                                                caterer=caterer,
                                                music=music,
                                                cosmetics=cosmetics,
                                                tailor=tailor,
                                                user=user,
                                                greenStatus=greenStatus)


@app.route('/book', methods=['POST'])
def book():
    if session['userType'] == "vendor":
        return bad_request("Vendors cannot book other vendors.")

    form = request.form
    vendor = Vendor.query.filter_by(id=form['vendorID']).first()
    user = User.query.filter_by(email=session['email']).first()
    vendor_id = vendor.id
    user_id = user.id
    eventDate = form['date']
    eventStartTime = "12:00:00"
    eventEndTime = "12:00:00"
    enabled = 1

    bookingInfo = {}
    bookingInfo['vendor_name'] = vendor.contactName
    bookingInfo['vendor_business'] = vendor.businessName

    dateInput = datetime.strptime(form['date'], '%Y-%m-%d')
    formattedDate = dateInput.strftime('%B %d, %Y')
    bookingInfo['book_date'] = formattedDate

    new_Booking = UserVendor(vendor_id, user_id, eventDate, eventStartTime, eventEndTime, enabled)
    db.session.add(new_Booking)
    db.session.commit()

    return jsonify(bookingInfo=bookingInfo)

@app.route('/bookexternal/vendortype/<string:vendor_type>')
def bookExternal(vendor_type):
    user = User.query.filter_by(email=session["email"]).first()
    vendor_id = VENDOR_TYPES[vendor_type]
    user_id = user.id
    eventDate = None
    eventStartTime = None
    eventEndTime = None
    enabled = 1

    booking = UserVendor.query.filter_by(user_id=user.id, vendor_id=vendor_id).first()
    if booking is not None:
        booking.enabled = True
        db.session.commit()
    else:
        new_Booking = UserVendor(vendor_id, user_id, eventDate, eventStartTime, eventEndTime, enabled)
        db.session.add(new_Booking)
        db.session.commit()
    return redirect("user-account")

@app.route('/vendor-list', methods=['GET', 'POST'])
def vendorList():
    session['url'] = request.path
    return render_template('vendor-list.html')

# AJAX call to return data from the DB as a json array
@app.route('/getvendors')
def vendor():
    if request.args.get("booked") == "true" and session.get('userType') == "user":
        user = User.query.filter_by(email=session['email']).first()
        bookedVendors = []
        query = UserVendor.query.join(Vendor, UserVendor.vendor_id == Vendor.id).add_columns(Vendor.id).filter(UserVendor.user_id == user.id).order_by(UserVendor.bookedDate)
        for row in query:
            bookedVendors.append(row.id)

        return jsonify(bookedVendors)

    vendor_type = request.args.get("type")

    if vendor_type == "all":
        query = Vendor.query.all()
    else:
        query = Vendor.query.filter_by(vendorType=vendor_type)

    vendors = []
    for vendor in query:
        if vendor.id in EXTERNAL_VENDOR_IDS:
            continue

        vendors.append({
            "id": vendor.id,
            "businessName": vendor.businessName,
            "contactName": vendor.contactName,
            "email":vendor.email,
            "streetAddress": vendor.streetAddress,
            "city": vendor.city,
            "zipcode": vendor.zipcode,
            "state": vendor.state,
            "rating": vendor.rating,
            "vendorType": vendor.vendorType,
            "price": vendor.price,
        })
    return jsonify(type=vendor_type, vendors=vendors)

def verifyVendorInputs(errorObj, name, business_name, vendor_type, email, street_address, city, zipcode, password, verify, price):
    if not email:
        errorObj["usererrors"].append('This field cannot be left blank.')
    # Check if is valid email
    elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
        errorObj["usererrors"].append('Must be a valid email.')

    if not password:
        errorObj["passerrors"].append('This field cannot be left blank.')
    else:
        # Check if password has a minimum length of 8 characters
        if len(password) < 8:
            errorObj["passerrors"].append("Password must be at least 8 characters long.")
        # Check if contains at least one digit
        if not re.search(r'\d', password):
            errorObj["passerrors"].append("Password must contain at least one number.")
        # Check if contains at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            errorObj["passerrors"].append("Password must contain at least one uppercase letter.")
        # Check if contains at least one lowercase letter
        if not re.search(r'[a-z]', password):
            errorObj["passerrors"].append("Password must contain at least one lowercase letter.")

    if password != verify:
        errorObj["verifyerrors"].append("Your passwords don't match.")

    if not name:
        errorObj["nameerrors"].append("This field cannot be left blank.")
    elif name.isdigit():
        errorObj["nameerrors"].append("Your name cannot contain numbers.")

    if not business_name:
        errorObj["businesserrors"].append("This field cannot be left blank.")

    if not vendor_type:
        errorObj["vendortypeerrors"].append("Please select a vendor type.")

    if not street_address:
        errorObj["addresserrors"].append("This field cannot be left blank.")

    if not zipcode:
        errorObj["zipcodeerrors"].append("This field cannot be left blank.")
    else:
        if zipcode.isalpha() or len(zipcode) < 5:
            errorObj["zipcodeerrors"].append("That is not a valid zipcode.")

    if not city:
        errorObj["cityerrors"].append("This field cannot be left blank.")

    if not price:
        errorObj["priceerrors"].append("This field cannot be left blank.")
    elif price.isalpha():
        errorObj["priceerrors"].append("Price must be a number.")

    return errorObj

def verifyUserInputs(errorObj, name, email, password, verify):
    if not name:
        errorObj["nameerrors"].append("This field cannot be left blank.")
    elif name.isdigit():
        errorObj["nameerrors"].append("Your name cannot contain numbers.")

    if not email:
        errorObj["usererrors"].append('This field cannot be left blank.')
    # Check if is valid email
    elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
        errorObj["usererrors"].append('Must be a valid email.')

    if not password:
        errorObj["passerrors"].append('This field cannot be left blank.')
    else:
        # Check if password has a minimum length of 8 characters
        if len(password) < 8:
            errorObj["passerrors"].append("Password must be at least 8 characters long.")
        # Check if contains at least one digit
        if not re.search(r'\d', password):
            errorObj["passerrors"].append("Password must contain at least one number.")
        # Check if contains at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            errorObj["passerrors"].append("Password must contain at least one uppercase letter.")
        # Check if contains at least one lowercase letter
        if not re.search(r'[a-z]', password):
            errorObj["passerrors"].append("Password must contain at least one lowercase letter.")

    if password != verify:
        errorObj["verifyerrors"].append("Your passwords don't match.")

    return errorObj


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    u_errors = {
      'usererrors': [],
      'passerrors': [],
      'verifyerrors': [],
      'nameerrors': []
    } # initializing user errors object

    v_errors = {
      'usererrors': [],
      'passerrors': [],
      'verifyerrors': [],
      'nameerrors': [],
      'businesserrors': [],
      'vendortypeerrors': [],
      'addresserrors': [],
      'cityerrors': [],
      'stateerrors': [],
      'zipcodeerrors': [],
      'priceerrors': []
    }

    user_info = {}
    vendor_info = {}

    if request.method == 'POST': #is user signing up
        form = request.form

        register_type = "user"

        # User signup validation
        if 'organizer_signup' in form:

            user_info['email'] = email = form['email']
            user_info['name'] = name = form['name']
            password = form['password']
            verify = form['verify']

            u_errors = verifyUserInputs(
                u_errors,
                name,
                email,
                password,
                verify
            )

            if all(u_errors.get(item) == [] for item in u_errors):
                user = User.query.filter_by(email=email).first()
                # Check if email already exists
                if not user:
                    # Hash the password before sending to DB
                    new_user = User(name, email, make_pw_hash(password))
                    db.session.add(new_user)
                    db.session.commit()
                    session['email'] = email
                    session['userType'] = "user"
                    session['name'] = new_user.name
                    session['userID'] = new_user.id
                    return render_template('confirmation-page.html')
                else:
                    u_errors["usererrors"].append("Email is already in use.")

        # Vendor signup validation
        elif 'vendor_signup' in form:
            register_type = 'vendor'

            vendor_info['email'] = email = form['email']
            vendor_info['name'] = name = form['name']
            password = form['password']
            verify = form['verify']
            vendor_info['business_name'] = business_name = form['business']
            vendor_info['vendor_type'] = vendor_type = form['vendortype']
            vendor_info['street_address'] = street_address = form['address']
            vendor_info['city'] = city = form['city']
            vendor_info['state'] = state = form['state']
            vendor_info['zipcode'] = zipcode = form['zipcode']
            vendor_info['price'] = price = form['price']

            v_errors = verifyVendorInputs(
                v_errors,
                name,
                business_name,
                vendor_type,
                email,
                street_address,
                city,
                zipcode,
                password,
                verify,
                price
            )

            if all(v_errors.get(item) == [] for item in v_errors):
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
                        city,
                        zipcode,
                        None,
                        vendor_type,
                        price,
                        make_pw_hash(password),
                        state
                    )
                    db.session.add(new_vendor)
                    db.session.commit()
                    session['email'] = email
                    session['userType'] = "vendor"
                    session['name'] = new_vendor.contactName
                    session['userID'] = new_vendor.id
                    return render_template('confirmation-page.html')
                else:
                    v_errors["usererrors"].append("Email is already in use.")

        # If method == post
        return render_template(
            'signup.html',
            u_errors=u_errors,
            v_errors=v_errors,
            user_info=user_info,
            vendor_info=vendor_info,
            type=register_type,
            statelist=statelist,
            typelist=typelist
        )
    # method == get
    return render_template(
        'signup.html',
        u_errors=u_errors,
        v_errors=v_errors,
        user_info=user_info,
        vendor_info=vendor_info,
        type="user",
        statelist=statelist,
        typelist=typelist
    )
    #for testing front end of portfolio
@app.route('/portfolio', methods=['GET', 'POST'])
def portfolio():
    vendor_id = request.args.get("vendor")
    vendor = Vendor.query.filter_by(id=vendor_id)

    if not vendor:
        flash("That user no longer exists.", "is-danger")
        return redirect('/')

    return render_template("portfolio.html")

# FOR TESTING PURPOSES ONLY
@app.route('/gendata')
def genData():
  vendorTypes = ['venue', 'photographer', 'videographer', 'caterer', 'music', 'cosmetics', 'tailor']
  fake = Faker()
  for i in range(25):
    user = User(
      fake.name(),
      fake.email(),
      make_pw_hash(fake.password(length=10, digits=True, upper_case=True, lower_case=True))
    )
    vendor = Vendor(
      fake.email(),
      fake.company(),
      fake.name(),
      fake.street_address(),
      fake.city(),
      fake.zipcode(),
      random.randrange(0, 6),
      random.choice(vendorTypes),
      random.randrange(1, 1000),
      make_pw_hash(fake.password(length=10, digits=True, upper_case=True, lower_case=True)),
      fake.state_abbr()
    )
    db.session.add(user)
    db.session.add(vendor)
    db.session.commit()
  return redirect('/')



# END TESTING #

if __name__ == '__main__': #run app
    app.run()
