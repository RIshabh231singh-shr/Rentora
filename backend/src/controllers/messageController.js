const Message = require('../models/message');
const Booking = require('../models/booking');
const Property = require('../models/property');
const User = require('../models/user');

const getContacts = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        
        let contactIds = new Set();
        
        if (role === 'tenant') {
            // Find properties the tenant has booked
            const bookings = await Booking.find({ user: userId, status: { $in: ["booked", "checked_in", "completed"] } }).populate('property');
            for (const b of bookings) {
                if (b.property && b.property.owner) {
                    contactIds.add(b.property.owner.toString());
                }
            }
        } else if (role === 'landlord') {
            // Find properties owned by the landlord
            const properties = await Property.find({ owner: userId });
            const propertyIds = properties.map(p => p._id);
            
            // Find bookings for these properties
            const bookings = await Booking.find({ property: { $in: propertyIds }, status: { $in: ["booked", "checked_in", "completed"] } });
            for (const b of bookings) {
                if (b.user) {
                    contactIds.add(b.user.toString());
                }
            }
        }
        
        // Exclude self
        contactIds.delete(userId.toString());
        
        const contacts = await User.find({ _id: { $in: Array.from(contactIds) } }).select('firstname lastname role email');
        
        // Also we want to attach the last message for each contact to show in the UI
        const contactList = await Promise.all(contacts.map(async contact => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: userId, receiver: contact._id },
                    { sender: contact._id, receiver: userId }
                ]
            }).sort({ createdAt: -1 });
            
            const unreadCount = await Message.countDocuments({
                sender: contact._id,
                receiver: userId,
                read: false
            });
            
            return {
                _id: contact._id,
                firstname: contact.firstname,
                lastname: contact.lastname,
                role: contact.role,
                lastMsg: lastMsg ? lastMsg.text || (lastMsg.image ? "Sent an image" : "") : "",
                time: lastMsg ? lastMsg.createdAt : null,
                unread: unreadCount,
                online: false // This will be handled in frontend via socket
            };
        }));
        
        // Sort by most recent message
        contactList.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return new Date(b.time) - new Date(a.time);
        });

        res.status(200).json({ success: true, data: contactList });
    } catch (err) {
        console.error("getContacts error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getMessages = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user._id;
        
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: contactId },
                { sender: contactId, receiver: userId }
            ]
        }).sort({ createdAt: 1 });
        
        // Mark as read
        await Message.updateMany(
            { sender: contactId, receiver: userId, read: false },
            { $set: { read: true } }
        );
        
        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        console.error("getMessages error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { getContacts, getMessages };
