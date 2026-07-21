const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user');
const Property = require('../models/property');
const Amenity = require('../models/amenity');
const Booking = require('../models/booking');

const seed = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING || 'mongodb://localhost:27017/rentora');
    console.log('Connected to DB');

    const ownerEmail = 'rishabhsinghnitn231@gmail.com';
    const tenantEmail = 'rishabh_b231201c@nitc.ac.in';

    let owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
        console.log('Owner not found, creating...');
        owner = await User.create({
            firstname: 'Rishabh',
            lastname: 'Singh',
            email: ownerEmail,
            password: 'password123',
            role: 'landlord',
            phoneNumber: '1234567890'
        });
    }

    let tenant = await User.findOne({ email: tenantEmail });
    if (!tenant) {
        console.log('Tenant not found, creating...');
        tenant = await User.create({
            firstname: 'Rishabh',
            lastname: 'Tenant',
            email: tenantEmail,
            password: 'password123',
            role: 'tenant',
            phoneNumber: '0987654321'
        });
    }

    // Create a property
    let property = await Property.findOne({ owner: owner._id, propertyName: 'Luxury Villa' });
    if (!property) {
        console.log('Creating property...');
        property = await Property.create({
            propertyName: 'Luxury Villa',
            propertyAddress: '123 Rich St',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001',
            country: 'India',
            owner: owner._id,
            tenants: [tenant._id],
            pricePerHour: 100,
            securityDeposit: 1000,
            description: 'A beautiful luxury villa',
            capacity: 10,
            rentType: 'monthly',
            images: [],
            openingHour: 6,
            closingHour: 22
        });
    }

    // Create an amenity
    let amenity = await Amenity.findOne({ property: property._id, name: 'Swimming Pool' });
    if (!amenity) {
        console.log('Creating amenity...');
        amenity = await Amenity.create({
            name: 'Swimming Pool',
            category: 'pool',
            property: property._id,
            pricePerHour: 500,
            capacity: 20,
            openingHour: 6,
            closingHour: 22
        });
    }

    // Create bookings (one checked_in, one booked, one completed)
    console.log('Creating bookings...');
    const now = new Date();
    
    // Checked In Booking (Active Now)
    const start1 = new Date(now);
    start1.setHours(now.getHours() - 1, 0, 0, 0);
    const end1 = new Date(now);
    end1.setHours(now.getHours() + 1, 0, 0, 0);
    
    await Booking.create({
        user: tenant._id,
        property: property._id,
        amenity: amenity._id,
        bookingStartTime: start1,
        bookingEndTime: end1,
        status: 'checked_in'
    });

    // Booked (Upcoming)
    const start2 = new Date(now);
    start2.setDate(now.getDate() + 1);
    start2.setHours(10, 0, 0, 0);
    const end2 = new Date(now);
    end2.setDate(now.getDate() + 1);
    end2.setHours(12, 0, 0, 0);

    await Booking.create({
        user: tenant._id,
        property: property._id,
        amenity: amenity._id,
        bookingStartTime: start2,
        bookingEndTime: end2,
        status: 'booked'
    });

    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
