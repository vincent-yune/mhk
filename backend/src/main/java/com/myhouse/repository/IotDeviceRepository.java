package com.myhouse.repository;

import com.myhouse.entity.IotDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IotDeviceRepository extends JpaRepository<IotDevice, Long> {
    List<IotDevice> findByHouseId(Long houseId);
    List<IotDevice> findByHouseIdAndZoneId(Long houseId, Long zoneId);
    List<IotDevice> findByHouseIdAndIsActiveTrue(Long houseId);
}
