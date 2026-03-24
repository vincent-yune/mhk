package com.myhouse.entity;

import lombok.*;
import javax.persistence.*;

@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NotificationType type = NotificationType.SYSTEM;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    private Long refId;

    @Column(length = 50)
    private String refType;

    @Builder.Default
    private Boolean isRead = false;

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = java.time.LocalDateTime.now();
    }

    public enum NotificationType {
        EXPIRY_WARN, REORDER, IOT_ALERT, COMMUNITY, TRADE, SYSTEM
    }
}
