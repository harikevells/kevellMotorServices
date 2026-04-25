const Notification = require('../models/Notification');

// Create a new notification (Internal use)
exports.createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get notifications for a user based on role and ID
exports.getNotifications = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    
    let query = {};
    
    if (role === 'admin') {
      // Admin sees everything or specifically tagged for admin
      query = { 
        $or: [
          { recipientRole: 'admin' },
          { recipientRole: 'all' }
        ]
      };
    } else {
      // Users and Vendors see notifications for their role and specific to them or 'all'
      query = {
        $or: [
          { recipientRole: role, recipientId: id },
          { recipientRole: role, recipientId: null },
          { recipientRole: 'all' }
        ]
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 for performance

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read for the user
exports.markAllAsRead = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    
    let query = {};
    if (role === 'admin') {
      query = { recipientRole: 'admin' };
    } else {
      query = { recipientRole: role, recipientId: id };
    }

    await Notification.updateMany(query, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};
