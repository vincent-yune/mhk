package com.myhouse.repository;

import com.myhouse.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByHouseId(Long houseId);
    List<Item> findByHouseIdAndZoneId(Long houseId, Long zoneId);
    List<Item> findByHouseIdAndStatus(Long houseId, Item.ItemStatus status);

    @Query("SELECT i FROM Item i WHERE i.house.id = :houseId AND i.expiryDate IS NOT NULL AND i.expiryDate <= :warningDate AND i.status = 'ACTIVE'")
    List<Item> findExpiringItems(@Param("houseId") Long houseId, @Param("warningDate") LocalDate warningDate);

    @Query("SELECT i FROM Item i WHERE i.house.id = :houseId AND i.isConsumable = true AND i.quantity <= i.reorderLevel AND i.status = 'ACTIVE'")
    List<Item> findItemsNeedingReorder(@Param("houseId") Long houseId);
}
