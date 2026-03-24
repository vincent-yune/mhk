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
public class HouseService {

    private final HouseRepository houseRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;

    @Transactional(readOnly = true)
    public List<House> getMyHouses(String email) {
        User user = findUser(email);
        return houseRepository.findByUserIdOrderByIsPrimaryDesc(user.getId());
    }

    @Transactional
    public House createHouse(String email, House house) {
        User user = findUser(email);
        house.setUser(user);
        House saved = houseRepository.save(house);

        // 기본 구역 자동 생성
        createDefaultZones(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public House getHouse(Long houseId, String email) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("집 정보를 찾을 수 없습니다."));
        checkOwner(house, email);
        return house;
    }

    @Transactional
    public House updateHouse(Long houseId, String email, House updated) {
        House house = getHouse(houseId, email);
        if (updated.getName() != null) house.setName(updated.getName());
        if (updated.getHouseType() != null) house.setHouseType(updated.getHouseType());
        if (updated.getAddress() != null) house.setAddress(updated.getAddress());
        if (updated.getArea() != null) house.setArea(updated.getArea());
        if (updated.getTheme() != null) house.setTheme(updated.getTheme());
        return houseRepository.save(house);
    }

    @Transactional
    public void deleteHouse(Long houseId, String email) {
        House house = getHouse(houseId, email);
        houseRepository.delete(house);
    }

    @Transactional(readOnly = true)
    public List<Zone> getZones(Long houseId, String email) {
        getHouse(houseId, email); // 소유권 확인
        return zoneRepository.findByHouseIdOrderBySortOrder(houseId);
    }

    @Transactional
    public Zone addZone(Long houseId, String email, Zone zone) {
        House house = getHouse(houseId, email);
        zone.setHouse(house);
        return zoneRepository.save(zone);
    }

    private void createDefaultZones(House house) {
        String[][] defaults = {
            {"거실", "LIVING_ROOM", "sofa", "0"},
            {"주방", "KITCHEN", "utensils", "1"},
            {"침실", "BEDROOM", "bed", "2"},
            {"욕실", "BATHROOM", "bath", "3"},
            {"베란다", "BALCONY", "wind", "4"}
        };
        for (String[] d : defaults) {
            Zone zone = Zone.builder()
                    .house(house)
                    .name(d[0])
                    .zoneType(Zone.ZoneType.valueOf(d[1]))
                    .icon(d[2])
                    .sortOrder(Integer.parseInt(d[3]))
                    .build();
            zoneRepository.save(zone);
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }

    private void checkOwner(House house, String email) {
        if (!house.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
    }
}
