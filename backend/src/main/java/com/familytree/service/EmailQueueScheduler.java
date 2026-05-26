package com.familytree.service;

import com.familytree.model.PendingEmailAndMessage;
import com.familytree.repository.PendingEmailAndMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailQueueScheduler {

    private final PendingEmailAndMessageRepository emailRepository;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@familytree.com}")
    private String fromEmail;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.mail.display-name:kincore}")
    private String mailDisplayName;

    @Scheduled(fixedDelay = 10000) // Run every 10 seconds
    @Transactional
    public void processPendingEmails() {
        List<PendingEmailAndMessage> pendingEmails = emailRepository.findFirst3ByStatus("PENDING");
        if (pendingEmails.isEmpty()) {
            return;
        }

        log.info("Found {} pending emails to process...", pendingEmails.size());

        for (PendingEmailAndMessage email : pendingEmails) {
            try {
                // If using the default unconfigured placeholder credentials, fall back to console logging immediately
                if (mailHost == null || mailHost.isBlank()) {
                    log.warn("SMTP credentials are using default placeholders. Simulating email delivery for ID: {}", email.getId());
                    logSimulatedEmail(email);
                    email.setStatus("SENT");
                    email.setSentAt(LocalDateTime.now());
                    emailRepository.save(email);
                    continue;
                }

                // Send real email via SMTP
                sendRealEmail(email);

                // Update status to 'SENT' and set sent_at timestamp
                email.setStatus("SENT");
                email.setSentAt(LocalDateTime.now());
                emailRepository.save(email);

                log.info("Successfully processed and sent email ID: {}", email.getId());
            } catch (org.springframework.mail.MailAuthenticationException e) {
                email.setStatus("FAILED");
                emailRepository.save(email);
                log.error("SMTP Authentication failed for email ID: {}. Error: {}", email.getId(), e.getMessage());
            } catch (Exception e) {
                email.setStatus("FAILED");
                emailRepository.save(email);
                log.error("Failed to process email ID: {}. Error: {}", email.getId(), e.getMessage());
            }
        }
    }

    private void sendRealEmail(PendingEmailAndMessage email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email.getEmail());
        message.setSubject(email.getSubject());
        message.setText(email.getMessage());

        String senderEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "no-reply@familytree.com";
        message.setFrom(String.format("%s <%s>", mailDisplayName, senderEmail));

        mailSender.send(message);
    }

    private void logSimulatedEmail(PendingEmailAndMessage email) {
        log.info("==========================================================================");
        log.info("[SIMULATED EMAIL DELIVERY] (Local Development Mode)");
        log.info("Recipient: {}", email.getEmail());
        log.info("Subject:   {}", email.getSubject());
        log.info("Message:");
        log.info("--------------------------------------------------------------------------");
        for (String line : email.getMessage().split("\n")) {
            log.info("  {}", line);
        }
        log.info("==========================================================================");
    }
}
