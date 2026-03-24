package com.myhouse.service;

import com.myhouse.entity.*;
import com.myhouse.exception.ResourceNotFoundException;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IotService {

    private final IotDeviceRepository deviceRepository;
    private final HouseRepository houseRepository;

    @Transactional(readOnly = true)
    public List<IotDevice> getDevices(Long houseId, String email) {
        checkOwner(houseId, email);
        return deviceRepository.findByHouseIdAndIsActiveTrue(houseId);
    }

    @Transactional
    public IotDevice addDevice(Long houseId, String email, IotDevice device) {
        House house = checkOwner(houseId, email);
        device.setHouse(house);
        return deviceRepository.save(device);
    }

    @Transactional
    public IotDevice updateDeviceStatus(Long deviceId, String email, IotDevice.DeviceStatus status) {
        IotDevice device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("기기를 찾을 수 없습니다."));
        if (!device.getHouse().getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        device.setStatus(status);
        device.setLastSeen(java.time.LocalDateTime.now());
        return deviceRepository.save(device);
    }

    @Transactional
    public void deleteDevice(Long deviceId, String email) {
        IotDevice device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("기기를 찾을 수 없습니다."));
        if (!device.getHouse().getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        device.setIsActive(false);
        deviceRepository.save(device);
    }

    private House checkOwner(Long houseId, String email) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        return house;
    }
}
