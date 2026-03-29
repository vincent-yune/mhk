package com.myhouse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myhouse.entity.IotDevice;
import com.myhouse.entity.User;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmartThingsService {

    private static final String ST_API_BASE = "https://api.smartthings.com/v1";
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ─── 토큰 저장/조회 ───────────────────────────────────────────────────────

    @Transactional
    public void saveToken(String email, String token) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        user.setSmartThingsToken(token);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean hasToken(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getSmartThingsToken() != null && !u.getSmartThingsToken().isEmpty())
                .orElse(false);
    }

    @Transactional
    public void deleteToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        user.setSmartThingsToken(null);
        userRepository.save(user);
    }

    // ─── SmartThings API 디바이스 목록 조회 ──────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSmartThingsDevices(String email) {
        String token = getToken(email);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = buildHeaders(token);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    ST_API_BASE + "/devices",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode items = root.get("items");
            List<Map<String, Object>> devices = new ArrayList<>();

            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    Map<String, Object> device = new LinkedHashMap<>();
                    device.put("deviceId", getTextSafe(item, "deviceId"));
                    device.put("name", getTextSafe(item, "name"));
                    device.put("label", getTextSafe(item, "label"));
                    device.put("type", getTextSafe(item, "type"));

                    // 제조사/모델 정보
                    JsonNode ocf = item.get("ocf");
                    if (ocf != null) {
                        device.put("manufacturer", getTextSafe(ocf, "mnmn"));
                        device.put("model", getTextSafe(ocf, "mnmo"));
                    }

                    // 카테고리 정보
                    JsonNode categories = item.get("categories");
                    if (categories != null && categories.isArray() && categories.size() > 0) {
                        device.put("category", getTextSafe(categories.get(0), "name"));
                    }

                    // Room 정보
                    device.put("roomId", getTextSafe(item, "roomId"));

                    // Components / capabilities
                    JsonNode components = item.get("components");
                    List<String> capabilityIds = new ArrayList<>();
                    if (components != null && components.isArray()) {
                        for (JsonNode comp : components) {
                            JsonNode caps = comp.get("capabilities");
                            if (caps != null && caps.isArray()) {
                                for (JsonNode cap : caps) {
                                    String capId = getTextSafe(cap, "id");
                                    if (!capId.isEmpty()) capabilityIds.add(capId);
                                }
                            }
                        }
                    }
                    device.put("capabilities", capabilityIds);
                    device.put("deviceTypeIcon", resolveDeviceTypeIcon(device));

                    devices.add(device);
                }
            }
            return devices;
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new UnauthorizedException("SmartThings 토큰이 만료되었거나 유효하지 않습니다.");
        } catch (Exception e) {
            log.error("SmartThings 디바이스 목록 조회 실패", e);
            throw new RuntimeException("SmartThings 디바이스 목록을 가져오는데 실패했습니다: " + e.getMessage());
        }
    }

    // ─── SmartThings 디바이스 상태 조회 ──────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getDeviceStatus(String email, String stDeviceId) {
        String token = getToken(email);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = buildHeaders(token);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    ST_API_BASE + "/devices/" + stDeviceId + "/status",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            Map<String, Object> status = new LinkedHashMap<>();

            // main component status 파싱
            JsonNode components = root.get("components");
            if (components != null) {
                JsonNode main = components.get("main");
                if (main != null) {
                    // switch 상태
                    JsonNode sw = main.get("switch");
                    if (sw != null) {
                        JsonNode swValue = sw.get("switch");
                        if (swValue != null) status.put("switch", getTextSafe(swValue, "value"));
                    }
                    // 온도
                    JsonNode temp = main.get("temperatureMeasurement");
                    if (temp != null) {
                        JsonNode tempValue = temp.get("temperature");
                        if (tempValue != null) {
                            status.put("temperature", tempValue.get("value"));
                            status.put("temperatureUnit", getTextSafe(tempValue, "unit"));
                        }
                    }
                    // 습도
                    JsonNode humidity = main.get("relativeHumidityMeasurement");
                    if (humidity != null) {
                        JsonNode humValue = humidity.get("humidity");
                        if (humValue != null) status.put("humidity", humValue.get("value"));
                    }
                    // 에어컨 냉각 모드
                    JsonNode cooling = main.get("airConditionerMode");
                    if (cooling != null) {
                        JsonNode modeValue = cooling.get("airConditionerMode");
                        if (modeValue != null) status.put("acMode", getTextSafe(modeValue, "value"));
                    }
                    // 세탁기 상태
                    JsonNode washer = main.get("washerOperatingState");
                    if (washer != null) {
                        JsonNode machineState = washer.get("machineState");
                        if (machineState != null) status.put("washerState", getTextSafe(machineState, "value"));
                    }
                    // 냉장고 온도
                    JsonNode fridgeTemp = main.get("refrigerationSetpoint");
                    if (fridgeTemp != null) {
                        JsonNode fridgeValue = fridgeTemp.get("refrigerationSetpoint");
                        if (fridgeValue != null) status.put("fridgeTemp", fridgeValue.get("value"));
                    }
                    // 밝기
                    JsonNode level = main.get("switchLevel");
                    if (level != null) {
                        JsonNode levelValue = level.get("level");
                        if (levelValue != null) status.put("brightness", levelValue.get("value"));
                    }
                    // 잠금
                    JsonNode lock = main.get("lock");
                    if (lock != null) {
                        JsonNode lockValue = lock.get("lock");
                        if (lockValue != null) status.put("lock", getTextSafe(lockValue, "value"));
                    }
                    // 배터리
                    JsonNode battery = main.get("battery");
                    if (battery != null) {
                        JsonNode battValue = battery.get("battery");
                        if (battValue != null) status.put("battery", battValue.get("value"));
                    }
                    // 에너지 소비
                    JsonNode energy = main.get("powerMeter");
                    if (energy != null) {
                        JsonNode powerValue = energy.get("power");
                        if (powerValue != null) status.put("power", powerValue.get("value"));
                    }
                }
            }

            return status;
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new UnauthorizedException("SmartThings 토큰이 유효하지 않습니다.");
        } catch (Exception e) {
            log.warn("SmartThings 디바이스 상태 조회 실패: {}", stDeviceId);
            return Collections.emptyMap();
        }
    }

    // ─── SmartThings 디바이스 명령 전송 ──────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> sendCommand(String email, String stDeviceId, String capability, String command, List<Object> args) {
        String token = getToken(email);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = buildHeaders(token);

        Map<String, Object> commandBody = new LinkedHashMap<>();
        Map<String, Object> cmd = new LinkedHashMap<>();
        cmd.put("component", "main");
        cmd.put("capability", capability);
        cmd.put("command", command);
        if (args != null && !args.isEmpty()) cmd.put("arguments", args);
        commandBody.put("commands", Collections.singletonList(cmd));

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    ST_API_BASE + "/devices/" + stDeviceId + "/commands",
                    HttpMethod.POST,
                    new HttpEntity<>(commandBody, headers),
                    String.class
            );
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("status", response.getStatusCode().value());
            return result;
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new UnauthorizedException("SmartThings 토큰이 유효하지 않습니다.");
        } catch (Exception e) {
            log.error("SmartThings 명령 전송 실패: device={}, cmd={}", stDeviceId, command, e);
            throw new RuntimeException("명령 전송 실패: " + e.getMessage());
        }
    }

    // ─── 유틸 ──────────────────────────────────────────────────────────────────

    private String getToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
        if (user.getSmartThingsToken() == null || user.getSmartThingsToken().isEmpty()) {
            throw new UnauthorizedException("SmartThings 계정이 연결되어 있지 않습니다. PAT를 먼저 등록해주세요.");
        }
        return user.getSmartThingsToken();
    }

    private HttpHeaders buildHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        return headers;
    }

    private String getTextSafe(JsonNode node, String field) {
        if (node == null) return "";
        JsonNode f = node.get(field);
        return (f != null && !f.isNull()) ? f.asText() : "";
    }

    private String resolveDeviceTypeIcon(Map<String, Object> device) {
        String category = (String) device.getOrDefault("category", "");
        String name = ((String) device.getOrDefault("name", "")).toLowerCase();
        String label = ((String) device.getOrDefault("label", "")).toLowerCase();
        @SuppressWarnings("unchecked")
        List<String> caps = (List<String>) device.getOrDefault("capabilities", Collections.emptyList());
        String deviceType = (String) device.getOrDefault("type", "");

        // HUB 타입은 OTHER로
        if ("HUB".equalsIgnoreCase(deviceType)) return "OTHER";

        // 1순위: SmartThings category 필드
        if (category != null && !category.isEmpty()) {
            switch (category) {
                case "Refrigerator":                        return "REFRIGERATOR";
                case "Washer": case "WasherDryer":          return "WASHER";
                case "Dryer":                               return "WASHER";
                case "AirConditioner":                      return "AC";
                case "AirPurifier": case "AirQualitySensor": return "AC";
                case "Television": case "RemoteController": return "TV";
                case "Light": case "SmartBulb": case "LEDStrip": return "LIGHT";
                case "Thermostat": case "TemperatureSensor": return "THERMOSTAT";
                case "SmartLock": case "Lock":              return "LOCK";
                case "Camera": case "VideoCamera":          return "CAMERA";
                case "Dishwasher":                          return "WASHER";
                case "Microwave": case "Oven": case "Range": return "OTHER";
                case "RobotCleaner":                        return "OTHER";
            }
        }

        // 2순위: capabilities 기반 감지
        if (caps.contains("samsungvd.pictureMode") || caps.contains("tvChannel") ||
                caps.contains("audioVolume") || caps.contains("mediaInputSource")) return "TV";
        if (caps.contains("refrigerationSetpoint") || caps.contains("samsungce.fridgeMode")) return "REFRIGERATOR";
        if (caps.contains("washerOperatingState") || caps.contains("dryerOperatingState")) return "WASHER";
        if (caps.contains("airConditionerMode") || caps.contains("airConditionerFanMode")) return "AC";
        if (caps.contains("lock")) return "LOCK";
        if (caps.contains("thermostat") || caps.contains("thermostatMode")) return "THERMOSTAT";
        if (caps.contains("imageCapture") || caps.contains("videoCapture")) return "CAMERA";
        if (caps.contains("switchLevel") || caps.contains("colorControl") || caps.contains("colorTemperature")) return "LIGHT";

        // 3순위: 이름/라벨 기반 한국어+영어 키워드
        if (name.contains("fridge") || name.contains("refrigerator") || label.contains("냉장고") || label.contains("비스포크")) return "REFRIGERATOR";
        if (name.contains("washer") || name.contains("dryer") || label.contains("세탁") || label.contains("건조")) return "WASHER";
        if (name.contains("air conditioner") || name.contains(" ac") || label.contains("에어컨") || label.contains("무풍")) return "AC";
        if (name.contains("qled") || name.contains("oled") || name.contains("tv") || name.contains("television") ||
                label.contains("qled") || label.contains("oled") || label.contains("tv")) return "TV";
        if (name.contains("light") || name.contains("bulb") || label.contains("조명") || label.contains("전등")) return "LIGHT";
        if (name.contains("lock") || name.contains("door") || label.contains("잠금") || label.contains("도어록")) return "LOCK";
        if (name.contains("cam") || name.contains("camera") || label.contains("카메라")) return "CAMERA";
        if (name.contains("hub")) return "OTHER";

        // 4순위: switch 있으면 기본 LIGHT 처리
        if (caps.contains("switch")) return "LIGHT";

        return "OTHER";
    }
}
