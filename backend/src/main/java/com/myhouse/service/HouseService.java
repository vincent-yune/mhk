package com.myhouse.service;

import com.myhouse.dto.response.HouseResponse;
import com.myhouse.dto.response.ZoneResponse;
import com.myhouse.entity.*;
import com.myhouse.exception.ResourceNotFoundException;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houseRepository;
    private final UserRepository userRepository;
    private final ZoneRepository zoneRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public List<HouseResponse> getMyHouses(String email) {
        User user = findUser(email);
        List<House> houses = houseRepository.findByUserIdOrderByIsPrimaryDesc(user.getId());
        return houses.stream().map(HouseResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public HouseResponse createHouse(String email, House house) {
        User user = findUser(email);
        house.setUser(user);
        House saved = houseRepository.save(house);
        createDefaultZones(saved);
        return HouseResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public HouseResponse getHouse(Long houseId, String email) {
        House house = findAndCheckOwner(houseId, email);
        List<Zone> zones = zoneRepository.findByHouseIdOrderBySortOrder(houseId);

        // 구역별 물품 수 조회
        Map<Long, Long> itemCountByZone = itemRepository.findByHouseId(houseId)
                .stream()
                .filter(item -> item.getZone() != null)
                .collect(Collectors.groupingBy(item -> item.getZone().getId(), Collectors.counting()));

        List<ZoneResponse> zoneResponses = zones.stream()
                .map(z -> ZoneResponse.from(z, itemCountByZone.getOrDefault(z.getId(), 0L).intValue()))
                .collect(Collectors.toList());

        return HouseResponse.from(house, zoneResponses);
    }

    @Transactional
    public HouseResponse updateHouse(Long houseId, String email, House updated) {
        House house = findAndCheckOwner(houseId, email);
        if (updated.getName() != null) house.setName(updated.getName());
        if (updated.getHouseType() != null) house.setHouseType(updated.getHouseType());
        if (updated.getAddress() != null) house.setAddress(updated.getAddress());
        if (updated.getArea() != null) house.setArea(updated.getArea());
        if (updated.getTheme() != null) house.setTheme(updated.getTheme());
        return HouseResponse.from(houseRepository.save(house));
    }

    @Transactional
    public HouseResponse updateMapImage(Long houseId, String email, String mapImageUrl) {
        House house = findAndCheckOwner(houseId, email);
        house.setMapImageUrl(mapImageUrl);
        return HouseResponse.from(houseRepository.save(house));
    }

    @Transactional
    public void deleteHouse(Long houseId, String email) {
        House house = findAndCheckOwner(houseId, email);
        houseRepository.delete(house);
    }

    @Transactional(readOnly = true)
    public List<ZoneResponse> getZones(Long houseId, String email) {
        findAndCheckOwner(houseId, email);
        List<Zone> zones = zoneRepository.findByHouseIdOrderBySortOrder(houseId);

        Map<Long, Long> itemCountByZone = itemRepository.findByHouseId(houseId)
                .stream()
                .filter(item -> item.getZone() != null)
                .collect(Collectors.groupingBy(item -> item.getZone().getId(), Collectors.counting()));

        return zones.stream()
                .map(z -> ZoneResponse.from(z, itemCountByZone.getOrDefault(z.getId(), 0L).intValue()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ZoneResponse addZone(Long houseId, String email, Zone zone) {
        House house = findAndCheckOwner(houseId, email);
        zone.setHouse(house);
        return ZoneResponse.from(zoneRepository.save(zone));
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

    private House findAndCheckOwner(Long houseId, String email) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        return house;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
