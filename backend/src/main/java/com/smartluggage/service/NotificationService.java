package com.smartluggage.service;

import com.smartluggage.model.Luggage;
import com.smartluggage.model.NotificationLog;
import com.smartluggage.repository.NotificationLogRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationLogRepository notificationLogRepository;

    public NotificationService(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    public void sendSms(Luggage luggage, String phoneNumber, String message) {
        NotificationLog log = new NotificationLog();
        log.setLuggage(luggage);
        log.setPhoneNumber(phoneNumber);
        log.setChannel("SMS");
        log.setMessage(message);
        notificationLogRepository.save(log);
    }
}
