package com.myhouse.repository;

import com.myhouse.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HouseRepository extends JpaRepository<House, Long> {
    List<House> findByUserId(Long userId);
    List<House> findByUserIdOrderByIsPrimaryDesc(Long userId);
}
