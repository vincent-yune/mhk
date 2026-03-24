package com.myhouse.controller;

import com.myhouse.entity.Notification;
import com.myhouse.security.JwtTokenProvider;
import com.myhouse.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    private Long getUserId(HttpServletRequest request) {
        String token = resolveToken(request);
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(HttpServletRequest request) {
        Long userId = getUserId(request);
        List<Notification> notifications = notificationService.getNotifications(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", notifications));
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnread(HttpServletRequest request) {
        Long userId = getUserId(request);
        List<Notification> unread = notificationService.getUnreadNotifications(userId);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", unread, "count", count));
    }

    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        Long userId = getUserId(request);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("success", true, "count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "읽음 처리 완료"));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpServletRequest request) {
        Long userId = getUserId(request);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "전체 읽음 처리 완료"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getUserId(request);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "알림 삭제 완료"));
    }
}
