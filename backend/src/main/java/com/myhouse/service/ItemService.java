package com.myhouse.service;

import com.myhouse.entity.*;
import com.myhouse.exception.ResourceNotFoundException;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final HouseRepository houseRepository;
    private final ZoneRepository zoneRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Item> getItems(Long houseId, Long zoneId, String email) {
        checkHouseOwner(houseId, email);
        if (zoneId != null) {
            return itemRepository.findByHouseIdAndZoneId(houseId, zoneId);
        }
        return itemRepository.findByHouseId(houseId);
    }

    @Transactional
    public Item createItem(Long houseId, String email, Item item) {
        House house = checkHouseOwner(houseId, email);
        item.setHouse(house);

        if (item.getZone() != null && item.getZone().getId() != null) {
            Zone zone = zoneRepository.findById(item.getZone().getId()).orElse(null);
            item.setZone(zone);
        }
        if (item.getCategory() != null && item.getCategory().getId() != null) {
            Category cat = categoryRepository.findById(item.getCategory().getId()).orElse(null);
            item.setCategory(cat);
        }
        return itemRepository.save(item);
    }

    @Transactional(readOnly = true)
    public Item getItem(Long itemId, String email) {
        Item item = findItem(itemId);
        if (!item.getHouse().getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        return item;
    }

    @Transactional
    public Item updateItem(Long itemId, String email, Item updated) {
        Item item = getItem(itemId, email);
        if (updated.getName() != null) item.setName(updated.getName());
        if (updated.getQuantity() != null) item.setQuantity(updated.getQuantity());
        if (updated.getStatus() != null) item.setStatus(updated.getStatus());
        if (updated.getExpiryDate() != null) item.setExpiryDate(updated.getExpiryDate());
        if (updated.getZone() != null) item.setZone(updated.getZone());
        return itemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long itemId, String email) {
        Item item = getItem(itemId, email);
        itemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<Item> getExpiringItems(Long houseId, String email, int days) {
        checkHouseOwner(houseId, email);
        return itemRepository.findExpiringItems(houseId, LocalDate.now().plusDays(days));
    }

    @Transactional(readOnly = true)
    public List<Item> getReorderItems(Long houseId, String email) {
        checkHouseOwner(houseId, email);
        return itemRepository.findItemsNeedingReorder(houseId);
    }

    private House checkHouseOwner(Long houseId, String email) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new ResourceNotFoundException("집 정보를 찾을 수 없습니다."));
        if (!house.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
        return house;
    }

    private Item findItem(Long itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("물품을 찾을 수 없습니다."));
    }
}
