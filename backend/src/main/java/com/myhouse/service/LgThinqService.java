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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LgThinqService {

    // LG ThinQ Connect Open API 베이스 URL
    private static final String LG_API_BASE = "https://api-kic.lgthinq.com";  // 한국
    private static final String LG_API_GLOBAL = "https://api-aic.lgthinq.com"; // 글로벌(US/EU)

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ─── 토큰 저장/조회/삭제 ──────────────────────────────────────────────────

    @Transactional
    public void saveToken(String email, String token) {
        User user = getUser(email);
        user.setLgThinqToken(token);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean hasToken(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getLgThinqToken() != null && !u.getLgThinqToken().isEmpty())
                .orElse(false);
    }

    @Transactional
    public void deleteToken(String email) {
        User user = getUser(email);
        user.setLgThinqToken(null);
        userRepository.save(user);
    }

    // ─── LG ThinQ 기기 목록 조회 ─────────────────────────────────────────────
    // API: GET /devices  (Bearer PAT)
    // 응답: { result: { items: [ { deviceId, deviceInfo: { deviceType, modelName, ... }, ... } ] } }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDevices(String email) {
        String token = getToken(email);
        RestTemplate rt = new RestTemplate();

        // 한국 서버 먼저 시도, 실패 시 글로벌 서버
        for (String base : List.of(LG_API_BASE, LG_API_GLOBAL)) {
            try {
                HttpHeaders headers = buildHeaders(token);
                ResponseEntity<String> resp = rt.exchange(
                        base + "/devices",
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        String.class
                );
                return parseDeviceList(resp.getBody());
            } catch (HttpClientErrorException.Unauthorized e) {
                throw new UnauthorizedException("LG ThinQ 토큰이 유효하지 않습니다.");
            } catch (HttpClientErrorException e) {
                log.warn("LG API 호출 실패 ({}): {} {}", base, e.getStatusCode(), e.getMessage());
            } catch (Exception e) {
                log.warn("LG API 연결 실패 ({}): {}", base, e.getMessage());
            }
        }
        throw new RuntimeException("LG ThinQ 서버에 연결할 수 없습니다.");
    }

    // ─── LG ThinQ 기기 상태 조회 ─────────────────────────────────────────────
    // API: GET /devices/{deviceId}/state

    @Transactional(readOnly = true)
    public Map<String, Object> getDeviceState(String email, String lgDeviceId) {
        String token = getToken(email);
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = buildHeaders(token);

        for (String base : List.of(LG_API_BASE, LG_API_GLOBAL)) {
            try {
                ResponseEntity<String> resp = rt.exchange(
                        base + "/devices/" + lgDeviceId + "/state",
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        String.class
                );
                return parseDeviceState(resp.getBody());
            } catch (HttpClientErrorException.Unauthorized e) {
                throw new UnauthorizedException("LG ThinQ 토큰이 유효하지 않습니다.");
            } catch (Exception e) {
                log.warn("LG 기기 상태 조회 실패: {}", lgDeviceId);
            }
        }
        return Collections.emptyMap();
    }

    // ─── LG ThinQ 기기 명령 전송 ─────────────────────────────────────────────
    // API: POST /devices/{deviceId}/control
    // Body: { "control": { "command": { ... } } }

    @Transactional(readOnly = true)
    public Map<String, Object> sendControl(String email, String lgDeviceId,
                                           String resource, String property, Object value) {
        String token = getToken(email);
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = buildHeaders(token);

        // LG ThinQ Control API payload
        Map<String, Object> propMap = new LinkedHashMap<>();
        propMap.put(property, value);
        Map<String, Object> command = new LinkedHashMap<>();
        command.put(resource, propMap);
        Map<String, Object> body = Map.of("control", Map.of("command", command));

        for (String base : List.of(LG_API_BASE, LG_API_GLOBAL)) {
            try {
                ResponseEntity<String> resp = rt.exchange(
                        base + "/devices/" + lgDeviceId + "/control",
                        HttpMethod.POST,
                        new HttpEntity<>(body, headers),
                        String.class
                );
                JsonNode root = objectMapper.readTree(resp.getBody());
                String resultCode = root.path("resultCode").asText("0000");
                boolean ok = "0000".equals(resultCode);
                return Map.of("success", ok, "resultCode", resultCode);
            } catch (HttpClientErrorException.Unauthorized e) {
                throw new UnauthorizedException("LG ThinQ 토큰이 유효하지 않습니다.");
            } catch (Exception e) {
                log.error("LG 명령 전송 실패 ({}): {}", base, e.getMessage());
            }
        }
        throw new RuntimeException("LG ThinQ 명령 전송 실패");
    }

    // ─── 파싱 유틸 ───────────────────────────────────────────────────────────

    private List<Map<String, Object>> parseDeviceList(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        List<Map<String, Object>> result = new ArrayList<>();

        // LG ThinQ API v2 응답 구조 파싱
        // { resultCode: "0000", result: { items: [...] } }  또는
        // { result: [ {...}, ... ] }
        JsonNode items = null;
        JsonNode resultNode = root.get("result");
        if (resultNode != null) {
            if (resultNode.isArray()) {
                items = resultNode;
            } else {
                items = resultNode.get("items");
                if (items == null) items = resultNode.get("devices");
            }
        }
        if (items == null) items = root.get("items");
        if (items == null) items = root.get("devices");

        if (items != null && items.isArray()) {
            for (JsonNode item : items) {
                Map<String, Object> device = new LinkedHashMap<>();

                String deviceId = getTextSafe(item, "deviceId");
                if (deviceId.isEmpty()) deviceId = getTextSafe(item, "id");
                device.put("deviceId", deviceId);

                // deviceInfo 중첩 객체
                JsonNode info = item.get("deviceInfo");
                if (info == null) info = item;

                String lgType = getTextSafe(info, "deviceType");
                String modelName = getTextSafe(info, "modelName");
                String alias = getTextSafe(info, "alias");
                if (alias.isEmpty()) alias = getTextSafe(item, "alias");
                if (alias.isEmpty()) alias = getTextSafe(item, "name");
                if (alias.isEmpty()) alias = modelName;
                if (alias.isEmpty()) alias = "LG 기기";

                device.put("name", alias);
                device.put("label", alias);
                device.put("lgDeviceType", lgType);
                device.put("modelName", modelName);
                device.put("manufacturer", "LG");
                device.put("reportable", item.path("reportable").asBoolean(false));
                device.put("deviceTypeIcon", resolveLgDeviceTypeIcon(lgType, alias));

                result.add(device);
            }
        }
        return result;
    }

    private Map<String, Object> parseDeviceState(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        Map<String, Object> state = new LinkedHashMap<>();

        JsonNode resultNode = root.get("result");
        if (resultNode == null) resultNode = root;

        // operation 상태
        JsonNode operation = resultNode.get("operation");
        if (operation != null) {
            // 에어컨
            String acMode = getTextSafe(operation, "airConOperationMode");
            if (!acMode.isEmpty()) state.put("power", "POWER_ON".equals(acMode) ? "on" : "off");
            // 세탁기
            String washerMode = getTextSafe(operation, "washerOperationMode");
            if (!washerMode.isEmpty()) state.put("washerMode", washerMode);
        }
        // 온도
        JsonNode temp = resultNode.get("temperature");
        if (temp != null) {
            JsonNode cur = temp.get("currentTemperatureC");
            if (cur == null) cur = temp.get("currentTemperature");
            if (cur != null && !cur.isNull()) state.put("temperature", cur.asDouble());
            JsonNode target = temp.get("targetTemperatureC");
            if (target != null && !target.isNull()) state.put("targetTemperature", target.asDouble());
        }
        // 냉장고 온도 (서브 디바이스)
        JsonNode refrigerator = resultNode.get("refrigeration");
        if (refrigerator != null) {
            state.put("refrigerationMode", getTextSafe(refrigerator, "expressMode"));
        }
        // run_state (세탁기/건조기/식기세척기 등)
        JsonNode runState = resultNode.get("runState");
        if (runState != null) {
            state.put("runState", getTextSafe(runState, "currentState"));
        }
        // 습도
        JsonNode humidity = resultNode.get("humidity");
        if (humidity != null) {
            JsonNode curHum = humidity.get("currentHumidity");
            if (curHum != null && !curHum.isNull()) state.put("humidity", curHum.asDouble());
        }
        // 배터리
        JsonNode battery = resultNode.get("battery");
        if (battery != null) {
            JsonNode batPct = battery.get("batteryPercent");
            if (batPct != null && !batPct.isNull()) state.put("battery", batPct.asInt());
        }
        // 전원 절약
        JsonNode powerSave = resultNode.get("powerSave");
        if (powerSave != null) {
            state.put("powerSave", powerSave.path("powerSaveEnabled").asBoolean(false));
        }

        return state;
    }

    // ─── 기기 타입 결정 ───────────────────────────────────────────────────────

    private String resolveLgDeviceTypeIcon(String lgType, String name) {
        if (lgType == null) lgType = "";
        String nameLower = (name != null ? name : "").toLowerCase();

        // LG ThinQ deviceType 코드 매핑
        switch (lgType.toUpperCase()) {
            case "DEVICE_AIR_CONDITIONER":      return "AC";
            case "DEVICE_AIR_PURIFIER":
            case "DEVICE_AIR_PURIFIER_FAN":     return "AC";
            case "DEVICE_REFRIGERATOR":
            case "DEVICE_KIMCHI_REFRIGERATOR":
            case "DEVICE_WINE_CELLAR":          return "REFRIGERATOR";
            case "DEVICE_WASHER":               return "WASHER";
            case "DEVICE_DRYER":                return "WASHER";
            case "DEVICE_STYLER":               return "WASHER";
            case "DEVICE_DISHWASHER":
            case "DEVICE_DISH_WASHER":          return "WASHER";
            case "DEVICE_ROBOT_CLEANER":
            case "DEVICE_STICK_CLEANER":        return "OTHER";
            case "DEVICE_OVEN":
            case "DEVICE_MICROWAVE_OVEN":       return "OTHER";
            case "DEVICE_HUMIDIFIER":
            case "DEVICE_DEHUMIDIFIER":         return "THERMOSTAT";
            case "DEVICE_SYSTEM_BOILER":        return "THERMOSTAT";
            case "DEVICE_WATER_HEATER":         return "THERMOSTAT";
            case "DEVICE_VENTILATOR":           return "AC";
            case "DEVICE_COOKTOP":              return "OTHER";
            case "DEVICE_HOOD":                 return "OTHER";
        }
        // 이름 기반 fallback
        if (nameLower.contains("세탁") || nameLower.contains("washer")) return "WASHER";
        if (nameLower.contains("냉장") || nameLower.contains("fridge")) return "REFRIGERATOR";
        if (nameLower.contains("에어") || nameLower.contains("air con")) return "AC";
        if (nameLower.contains("청소") || nameLower.contains("robo")) return "OTHER";
        return "OTHER";
    }

    // ─── 유틸 ─────────────────────────────────────────────────────────────────

    private String getToken(String email) {
        User user = getUser(email);
        if (user.getLgThinqToken() == null || user.getLgThinqToken().isEmpty()) {
            throw new UnauthorizedException("LG ThinQ 계정이 연결되어 있지 않습니다. PAT를 먼저 등록해주세요.");
        }
        return user.getLgThinqToken();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
    }

    private HttpHeaders buildHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        // LG ThinQ API 필수 헤더
        headers.set("x-client-id", UUID.randomUUID().toString());
        headers.set("x-message-id", UUID.randomUUID().toString());
        headers.set("x-country-code", "KR");
        headers.set("x-service-code", "SVC202");
        headers.set("x-api-version", "2.0");
        return headers;
    }

    private String getTextSafe(JsonNode node, String field) {
        if (node == null) return "";
        JsonNode f = node.get(field);
        return (f != null && !f.isNull()) ? f.asText() : "";
    }
}
