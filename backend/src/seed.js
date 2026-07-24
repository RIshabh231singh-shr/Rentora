const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const Property = require('./models/property');
const Amenity = require('./models/amenity');
const Booking = require('./models/booking');
const MaintenanceRequest = require('./models/maintainanceRequest');
const Notification = require('./models/notification');
// Assuming Reviews/Ratings/Chats schemas don't exist yet based on previous views, I will only seed the existing models.

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Realistic Seed Arrays
const cities = ["Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Pune", "Chennai", "Gurugram", "Noida"];
const states = { "Mumbai": "Maharashtra", "Pune": "Maharashtra", "Bengaluru": "Karnataka", "Delhi": "Delhi", "Hyderabad": "Telangana", "Chennai": "Tamil Nadu", "Gurugram": "Haryana", "Noida": "Uttar Pradesh" };
const propertyTypes = ["house", "villa", "commercial", "gym", "swimmingpool"];
const propAdjectives = ["Luxury", "Premium", "Cozy", "Modern", "Spacious", "Elite", "Executive", "Serene", "Grand"];
const propNouns = ["Residency", "Apartments", "Villa", "Heights", "Towers", "Complex", "Enclave", "Studios"];
const propImages = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1e52d1590c?w=800",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    "https://images.unsplash.com/photo-1572331165267-854da2e10ccc?w=800",
    "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800"
];

const amenityNames = {
    house: ["Wi-Fi", "Parking", "Power Backup", "Clubhouse", "Park"],
    villa: ["Private Pool", "Garden", "Home Theater", "Security Guard", "Gym"],
    commercial: ["High-speed Internet", "Meeting Room", "Cafeteria", "Lounge", "Reception"],
    gym: ["Treadmills", "Free Weights", "Steam Bath", "Yoga Room", "Locker Room"],
    swimmingpool: ["Showers", "Lifeguard", "Changing Rooms", "Lounge Chairs", "Kids Pool"]
};

const maintenanceIssues = [
    { title: "AC Not Cooling", category: "electrical", desc: "The living room AC is blowing warm air." },
    { title: "Leaking Pipe", category: "plumbing", desc: "Water is leaking from the sink pipe." },
    { title: "Deep Cleaning Needed", category: "cleaning", desc: "Need a thorough cleaning of the carpets." },
    { title: "Faulty Wiring", category: "electrical", desc: "The main hall lights are flickering." },
    { title: "Broken Window", category: "carpentry", desc: "The glass in the master bedroom window is cracked." },
    { title: "Clogged Drain", category: "plumbing", desc: "The shower drain is completely blocked." }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECT_STRING);
        console.log("Connected to MongoDB for massive seeding...");

        // 1. Fetch Exact Users (Case Insensitive)
        const emails = [
            "rishabhsinghnitian231@gmail.com",
            "rishabh_b231201ce@nitc.ac.in",
            "jitendrakumarsingh8102@gmail.com"
        ];
        
        const users = await User.find({ email: { $in: emails.map(e => new RegExp(`^${e}$`, "i")) } });
        
        const admin = users.find(u => u.email.toLowerCase() === "rishabhsinghnitian231@gmail.com");
        const landlord = users.find(u => u.email.toLowerCase() === "rishabh_b231201ce@nitc.ac.in");
        const tenant = users.find(u => u.email.toLowerCase() === "jitendrakumarsingh8102@gmail.com");

        if (!admin || !landlord || !tenant) {
            console.error("❌ Required existing users not found. Make sure the database contains the 3 emails.");
            process.exit(1);
        }

        console.log("✅ Users preserved and fetched successfully.");

        // 2. Delete ALL non-user data
        await Property.deleteMany({});
        await Amenity.deleteMany({});
        await Booking.deleteMany({});
        await MaintenanceRequest.deleteMany({});
        await Notification.deleteMany({});
        
        // Remove orphaned references from Users
        await User.updateMany({}, { $set: { myProperties: [], myTenants: [] } });

        console.log("🧹 Deleted old data. Starting fresh generation...");

        // 3. Generate 25 Properties
        const propertiesData = [];
        for (let i = 0; i < 25; i++) {
            const city = getRandom(cities);
            const type = getRandom(propertyTypes);
            const isMonthly = (type === "house" || type === "villa");
            
            propertiesData.push({
                propertyName: `${getRandom(propAdjectives)} ${getRandom(propNouns)} ${city}`,
                propertyType: type,
                propertyAddress: `Sector ${randomInt(1, 100)}, Landmark Road`,
                city: city,
                state: states[city],
                pincode: randomInt(110000, 800000),
                country: "India",
                owner: Math.random() > 0.3 ? landlord._id : admin._id,
                tenants: Math.random() > 0.5 ? [tenant._id] : [],
                pendingTenants: [],
                description: `A beautiful and realistic ${type} located in the heart of ${city}. Equipped with modern facilities and robust security. Perfect for everyday use.`,
                capacity: randomInt(2, 50),
                amenities: Array.from({length: randomInt(2, 4)}, () => getRandom(amenityNames[type])),
                pricePerHour: isMonthly ? randomInt(20000, 150000) : randomInt(100, 2000),
                rentType: isMonthly ? "monthly" : "hourly",
                openingHour: randomInt(0, 8),
                closingHour: randomInt(20, 23),
                securityDeposit: isMonthly ? randomInt(50000, 300000) : randomInt(500, 5000),
                images: [getRandom(propImages), getRandom(propImages)]
            });
        }

        const createdProperties = await Property.insertMany(propertiesData);
        console.log(`🏠 Created ${createdProperties.length} Properties.`);

        // Update landlord properties and tenants
        const landlordProps = createdProperties.filter(p => p.owner.toString() === landlord._id.toString());
        landlord.myProperties = landlordProps.map(p => p._id);
        if (createdProperties.some(p => p.tenants.includes(tenant._id))) {
            landlord.myTenants = [tenant._id];
        }
        await landlord.save();

        // 4. Generate 55 Amenities
        const amenitiesData = [];
        for (let i = 0; i < 55; i++) {
            const prop = getRandom(createdProperties);
            const category = getRandom(["fitness", "leisure", "workspace", "parking", "other"]);
            amenitiesData.push({
                name: `${prop.propertyName.split(' ')[0]} ${category === 'fitness' ? 'Gym' : category === 'workspace' ? 'Conference' : 'Pool'}`,
                description: `Dedicated ${category} area located within ${prop.propertyName}.`,
                category: category,
                property: prop._id,
                capacity: randomInt(5, 20),
                pricePerHour: randomInt(0, 500),
                openingHour: prop.openingHour,
                closingHour: prop.closingHour,
                isActive: true,
                images: [getRandom(propImages)],
                slotDuration: randomInt(1, 3)
            });
        }

        const createdAmenities = await Amenity.insertMany(amenitiesData);
        console.log(`✨ Created ${createdAmenities.length} Amenities.`);

        // 5. Generate 60 Bookings (Past, Present, Future)
        const bookingsData = [];
        const now = new Date();
        
        for (let i = 0; i < 60; i++) {
            const prop = getRandom(createdProperties);
            const amenity = Math.random() > 0.5 ? getRandom(createdAmenities.filter(a => a.property.toString() === prop._id.toString())) : null;
            
            // Generate realistic times
            const daysOffset = randomInt(-30, 30);
            const startHour = randomInt(prop.openingHour || 8, (prop.closingHour || 20) - 2);
            
            const startTime = new Date(now);
            startTime.setDate(now.getDate() + daysOffset);
            startTime.setHours(startHour, 0, 0, 0);
            
            const endTime = new Date(startTime);
            endTime.setHours(startHour + randomInt(1, 4), 0, 0, 0);

            let status = "booked";
            let paymentStatus = "pending";
            let checkIn = null;
            let checkOut = null;

            if (daysOffset < 0) {
                // Past booking
                status = Math.random() > 0.2 ? "completed" : "cancelled";
                paymentStatus = status === "completed" ? "paid" : "failed";
                if (status === "completed") {
                    checkIn = new Date(startTime.getTime() - randomInt(0, 10) * 60000);
                    checkOut = new Date(endTime.getTime() + randomInt(0, 15) * 60000);
                }
            } else if (daysOffset === 0) {
                // Today
                status = "checked_in";
                paymentStatus = "paid";
                checkIn = new Date(startTime.getTime() - randomInt(0, 5) * 60000);
            } else {
                // Future
                status = "booked";
                paymentStatus = Math.random() > 0.5 ? "paid" : "pending";
            }

            bookingsData.push({
                user: tenant._id,
                property: prop._id,
                amenity: amenity ? amenity._id : undefined,
                bookingStartTime: startTime,
                bookingEndTime: endTime,
                checkInTime: checkIn,
                checkOutTime: checkOut,
                paymentStatus: paymentStatus,
                totalAmount: randomInt(500, 5000),
                status: status
            });
        }

        const createdBookings = await Booking.insertMany(bookingsData);
        console.log(`📅 Created ${createdBookings.length} Bookings.`);

        // 6. Generate 30 Maintenance Requests
        const maintenanceData = [];
        for (let i = 0; i < 30; i++) {
            const prop = getRandom(createdProperties);
            const issue = getRandom(maintenanceIssues);
            const daysOffset = randomInt(-15, 0);
            const created = new Date(now);
            created.setDate(now.getDate() + daysOffset);

            let status = "pending";
            let resolvedAt = null;
            let resolutionNotes = null;
            let rating = null;

            if (daysOffset < -5) {
                status = "resolved";
                resolvedAt = new Date(created);
                resolvedAt.setHours(created.getHours() + randomInt(2, 48)); // Realistic resolution time
                resolutionNotes = "Fixed the issue as requested. Component replaced.";
                rating = randomInt(3, 5);
            } else if (daysOffset < -2) {
                status = "in_progress";
            }

            maintenanceData.push({
                user: tenant._id,
                property: prop._id,
                title: issue.title,
                description: issue.desc,
                category: issue.category,
                status: status,
                assignedStaff: status !== "pending" ? admin._id : null,
                images: Math.random() > 0.5 ? [getRandom(propImages)] : [],
                resolvedAt: resolvedAt,
                resolvedBy: resolvedAt ? admin._id : null,
                resolutionNotes: resolutionNotes,
                rating: rating,
                feedback: rating ? (rating >= 4 ? "Great service!" : "Okay.") : null,
                paymentStatus: "paid",
                totalAmount: randomInt(200, 2000),
                createdAt: created,
                updatedAt: resolvedAt || created
            });
        }

        const createdMaintenance = await MaintenanceRequest.insertMany(maintenanceData);
        console.log(`🛠️ Created ${createdMaintenance.length} Maintenance Requests.`);

        // 7. Generate 40 Notifications
        const notificationsData = [];
        for (let i = 0; i < 40; i++) {
            const isBooking = Math.random() > 0.5;
            let message = "";
            let title = "";
            let type = "";
            let propId = null;

            if (isBooking) {
                const booking = getRandom(createdBookings);
                type = "BOOKING_CONFIRMED";
                title = "Booking Update";
                message = `Your booking status is now: ${booking.status}.`;
                propId = booking.property;
            } else {
                const req = getRandom(createdMaintenance);
                type = "MAINTENANCE_CREATED";
                title = "Maintenance Update";
                message = `Request "${req.title}" status is now: ${req.status}.`;
                propId = req.property;
            }

            notificationsData.push({
                recipient: Math.random() > 0.5 ? tenant._id : landlord._id,
                type: type,
                title: title,
                message: message,
                relatedProperty: propId,
                status: Math.random() > 0.7 ? "unread" : "read"
            });
        }

        await Notification.insertMany(notificationsData);
        console.log(`🔔 Created ${notificationsData.length} Notifications.`);

        console.log("🚀 ✅ Massive Database Seeding Completed Successfully! All relationships preserved.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding error:", err);
        process.exit(1);
    }
};

seedDatabase();
