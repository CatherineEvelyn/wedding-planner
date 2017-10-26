from flask import Flask, request, redirect, render_template, url_for, session, flash, jsonify, Markup, abort
from flask_sqlalchemy import SQLAlchemy
from hashutils import *
import re
from faker import Faker
import random
from datetime import datetime
from sqlalchemy import create_engine
import json

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
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id')) # primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id')) # primary_key=True)
    bookedDate = db.Column(db.Date)
    eventStartTime = db.Column(db.Time)
    eventEndTime = db.Column(db.Time)
    vendor = db.relationship('Vendor', backref="user_assoc")
    user = db.relationship('User', backref="vendor_assoc")

    def __init__(self, vendor_id, user_id, bookedDate, eventStartTime, eventEndTime):
        self.vendor_id = vendor_id
        self.user_id = user_id
        self.bookedDate = bookedDate
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
    phoneNumber = db.Column(db.BIGINT)
    password = db.Column(db.String(100))
    numberOfGuests = db.Column(db.Integer)
    eventDate = db.Column(db.Date)
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
    blacklist = ['user', 'profile', 'book' ]
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
                return redirect_dest(fallback=url_for('index'))
        elif vendor:
            if not check_pw_hash(password, vendor.password):
                passerrors.append("That password is incorrect.")
            else:
                session['email'] = email #starts session
                session['userType'] = "vendor"
                session['name'] = vendor.contactName
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
    return redirect('/')

@app.route('/')
def index():
    session['url'] = request.path
    return render_template('index.html')

@app.route('/profile')
def profile():
    if session['userType'] == "user":
        flash("You do not have permission to visit that page.", "is-danger")
        return redirect(session['url'])

    session['url'] = request.path

    vendor = Vendor.query.filter_by(email=session["email"]).first() #get vendor in session
    vendId = str(vendor.id)

    #result = db.engine.execute("SELECT * FROM user_vendor JOIN user ON user_vendor.user_id=user.id WHERE vendor_id = '"+vendId+"'")
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

    if request.args.get('source') == "ajax":
        return jsonify(userInfo)

    return render_template("vendor-account.html", userInfo = userInfo, vendor_id=vendor.id)


@app.route('/user-account')
def organizer():
    if session['userType'] == "vendor":
        flash("You do not have permission to visit that page.", "is-danger")
        return redirect(session['url'])

    session['url'] = request.path

    user = User.query.filter_by(email=session["email"]).first() #TODO: get user in session
    user_id = str(user.id) #get user's id - turn to string for query

    result = db.engine.execute("SELECT * FROM user_vendor JOIN vendor ON user_vendor.vendor_id=vendor.id WHERE user_id = '" + user_id + "'")
    #q = session.query(UserVendor).filter(UserVendor).join(UserVendor.vendor_id).filter.all()
    #usersVendors = UserVendor.query.filter_by(user_id=users_id).first() 
    #vendorName = result.contactName
    #for item in result:
        #vendorName == item.contactName


    venue = []
    photographer = []
    videographer= []
    caterer = []
    music = []
    cosmetics = []
    tailor = []

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
                                                user=user )


"""    
    vendorInfo = []
    '''vendorName = []
    vendorBusiness = []
    vendorEmail = []
    for row in result:
        vendorName.append("Name: " + row['contactName'])
        vendorBusiness.append("Business name: " + row['businessName'])
        vendorEmail.append("Email: " + row['email'])
    #connection.close()
    return render_template("testUserVendor.html", vendorName=vendorName, vendorBusiness=vendorBusiness, vendorEmail=vendorEmail)'''
    '''for row in result:
        
        vendorInfo.append("Name: " + row['contactName'])
        vendorInfo.append("Business name: " + row['businessName'])
        vendorInfo.append("Vendor Type: " + row['vendorType'])
        vendorInfo.append("Street Address: " + row['streetAddress'])
        vendorInfo.append("City: " + row['city'])
        vendorInfo.append("Zipcode: " + str(row['zipcode']))

        vendorInfo.append("State: " + row['state'])

        vendorInfo.append(row)

        if row.vendorType == 'cosmetics':
            greenStatus = "is-selected"
        else:
            greenStatus = ""
            '''
    venue = []
    cosmetics = []
    for row in result:
        if row.vendorType == "venue":
            venue.append(row)
        elif row.vendorType == "cosmetics":
            cosmetics.append(row)
    return render_template("user-account.html", venue =venue, cosmetics= cosmetics)

    #return render_template("user-account.html", vendorInfo = vendorInfo, userName = x, greenStatus = greenStatus, businessName = businessName, contactName = contactName, email = email)
    #return render_template("testUserVendor.html", vendorInfo = vendorInfo)  
"""


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

    bookingInfo = {}
    bookingInfo['vendor_name'] = vendor.contactName
    bookingInfo['vendor_business'] = vendor.businessName

    dateInput = datetime.strptime(form['date'], '%Y-%m-%d')
    formattedDate = dateInput.strftime('%B %d, %Y')
    bookingInfo['book_date'] = formattedDate

    new_Booking = UserVendor(vendor_id, user_id, eventDate, eventStartTime, eventEndTime)
    db.session.add(new_Booking)
    db.session.commit()

    return jsonify(bookingInfo=bookingInfo)

@app.route('/vendor-list', methods=['GET', 'POST'])
def vendorList():
    session['url'] = request.path
    return render_template('vendor-list.html')

# AJAX call to return data from the DB as a json array
@app.route('/getvendors')
def vendor():
    vendor_type = request.args.get("type")
    if vendor_type == "all":
        query = Vendor.query.all()
    else:
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
            "state": vendor.state,
            "rating": vendor.rating,
            "vendorType": vendor.vendorType,
            "prinMin": vendor.priceMin,
            "priceMax": vendor.priceMax
        })
    return jsonify(type=vendor_type, vendors=vendors)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    session['url'] = request.path
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
      'priceminerrors': [],
      'pricemaxerrors': []
    }

    user_info = {}
    vendor_info = {}

    if request.method == 'POST': #is user signing up
        form = request.form

        # User signup validation
        if 'user_signup' in form:
            register_type = 'user'

            user_info['email'] = email = form['email']
            user_info['name'] = name = form['name']
            password = form['password']
            verify = form['verify']

            if not name:
                u_errors["nameerrors"].append("This field cannot be left blank.")
            elif name.isdigit():
                u_errors["nameerrors"].append("Your name cannot contain numbers.")

            if not email:
                u_errors["usererrors"].append('This field cannot be left blank.')
            # Check if is valid email
            elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
                u_errors["usererrors"].append('Must be a valid email.')

            if not password:
                u_errors["passerrors"].append('This field cannot be left blank.')
            else:
                # Check if password has a minimum length of 8 characters
                if len(password) < 8:
                    u_errors["passerrors"].append("Password must be at least 8 characters long.")
                # Check if contains at least one digit
                if not re.search(r'\d', password):
                    u_errors["passerrors"].append("Password must contain at least one number.")
                # Check if contains at least one uppercase letter
                if not re.search(r'[A-Z]', password):
                    u_errors["passerrors"].append("Password must contain at least one uppercase letter.")
                # Check if contains at least one lowercase letter
                if not re.search(r'[a-z]', password):
                    u_errors["passerrors"].append("Password must contain at least one lowercase letter.")

            if password != verify:
                u_errors["verifyerrors"].append("Your passwords don't match.")

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
                    session['name'] = user.name
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
            vendor_info['price_min'] = price_min = form['pricemin']
            vendor_info['price_max'] = price_max = form['pricemax']

            if not email:
                v_errors["usererrors"].append('This field cannot be left blank.')
            # Check if is valid email
            elif not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
                v_errors["usererrors"].append('Must be a valid email.')

            if not password:
                v_errors["passerrors"].append('This field cannot be left blank.')
            else:
                # Check if password has a minimum length of 8 characters
                if len(password) < 8:
                    v_errors["passerrors"].append("Password must be at least 8 characters long.")
                # Check if contains at least one digit
                if not re.search(r'\d', password):
                    v_errors["passerrors"].append("Password must contain at least one number.")
                # Check if contains at least one uppercase letter
                if not re.search(r'[A-Z]', password):
                    v_errors["passerrors"].append("Password must contain at least one uppercase letter.")
                # Check if contains at least one lowercase letter
                if not re.search(r'[a-z]', password):
                    v_errors["passerrors"].append("Password must contain at least one lowercase letter.")

            if password != verify:
                v_errors["verifyerrors"].append("Your passwords don't match.")

            if not name:
                v_errors["nameerrors"].append("This field cannot be left blank.")
            elif name.isdigit():
                v_errors["nameerrors"].append("Your name cannot contain numbers.")

            if not business_name:
                v_errors["businesserrors"].append("This field cannot be left blank.")

            if not vendor_type:
                v_errors["vendortypeerrors"].append("Please select a vendor type.")

            if not street_address:
                v_errors["addresserrors"].append("This field cannot be left blank.")

            if not zipcode:
                v_errors["zipcodeerrors"].append("This field cannot be left blank.")
            else:
                if zipcode.isalpha() or len(zipcode) < 5:
                    v_errors["zipcodeerrors"].append("That is not a valid zipcode.")

            if not city:
                v_errors["cityerrors"].append("This field cannot be left blank.")

            if not price_min:
                v_errors["priceminerrors"].append("This field cannot be left blank.")
            elif price_min.isalpha():
                v_errors["priceminerrors"].append("Minimum price must be a number.")

            if not price_max:
                v_errors["pricemaxerrors"].append("This field cannot be left blank.")
            elif price_min.isalpha():
                v_errors["pricemaxerrors"].append("Maximum price must be a number.")


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
                        price_min,
                        price_max,
                        make_pw_hash(password),
                        state
                    )
                    db.session.add(new_vendor)
                    db.session.commit()
                    session['email'] = email
                    session['userType'] = "vendor"
                    session['name'] = vendor.contactName
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
            type=register_type
        )
    # method == get
    return render_template(
        'signup.html',
        u_errors=u_errors,
        v_errors=v_errors,
        user_info=user_info,
        vendor_info=vendor_info,
        type="user"
    )

# FOR TESTING PURPOSES ONLY
@app.route('/gendata')
def genData():
  vendorTypes = ['venue', 'photographer', 'videographer', 'caterer', 'music', 'cosmetics', 'tailor']
  fake = Faker()
  for i in range(5):
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
      random.randrange(1, 6),
      random.choice(vendorTypes),
      random.randrange(1, 101),
      random.randrange(101, 501),
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
