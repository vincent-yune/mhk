package com.myhouse.repository;

import com.myhouse.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    Page<CommunityPost> findByStatus(CommunityPost.PostStatus status, Pageable pageable);
    Page<CommunityPost> findByPostTypeAndStatus(CommunityPost.PostType postType, CommunityPost.PostStatus status, Pageable pageable);
    List<CommunityPost> findByUserIdOrderByCreatedAtDesc(Long userId);
}
