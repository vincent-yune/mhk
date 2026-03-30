package com.myhouse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myhouse.entity.User;
import com.myhouse.exception.UnauthorizedException;
import com.myhouse.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhilipsHueService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ── Bridge 연결 정보 저장/조회 ─────────────────────────────────────────────

    @Transactional
    public void saveBridge(String email, String bridgeIp, String hueUsername) {
        User user = getUser(email);
        user.setHueBridgeIp(bridgeIp.trim());
        user.setHueUsername(hueUsername.trim());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public boolean isConnected(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getHueBridgeIp() != null && !u.getHueBridgeIp().isEmpty()
                       && u.getHueUsername() != null && !u.getHueUsername().isEmpty())
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getBridgeInfo(String email) {
        User user = getUser(email);
        return Map.of(
            "bridgeIp",    user.getHueBridgeIp()  != null ? user.getHueBridgeIp()  : "",
            "hueUsername", user.getHueUsername()   != null ? user.getHueUsername()  : ""
        );
    }

    @Transactional
    public void disconnect(String email) {
        User user = getUser(email);
        user.setHueBridgeIp(null);
        user.setHueUsername(null);
        userRepository.save(user);
    }

    // ── Bridge 자동 탐색 (Hue Discovery API) ──────────────────────────────────
    // https://discovery.meethue.com/ 를 통해 로컬 네트워크 Bridge 탐색
    public List<Map<String, String>> discoverBridges() {
        RestTemplate rt = new RestTemplate();
        List<Map<String, String>> result = new ArrayList<>();
        try {
            ResponseEntity<String> resp = rt.getForEntity(
                "https://discovery.meethue.com/", String.class);
            JsonNode arr = objectMapper.readTree(resp.getBody());
            if (arr.isArray()) {
                for (JsonNode n : arr) {
                    Map<String, String> bridge = new LinkedHashMap<>();
                    bridge.put("id",                getTextSafe(n, "id"));
                    bridge.put("internalipaddress", getTextSafe(n, "internalipaddress"));
                    bridge.put("port",              getTextSafe(n, "port"));
                    result.add(bridge);
                }
            }
        } catch (Exception e) {
            log.warn("Hue Bridge 탐색 실패: {}", e.getMessage());
        }
        return result;
    }

    // ── Bridge username 발급 (버튼 누르기 방식) ────────────────────────────────
    // 1) POST http://{bridgeIp}/api  {"devicetype":"myhouse#server"}
    // 2) Bridge 버튼을 누른 후 호출 → {"success":{"username":"..."}} 반환
    public String createUsername(String bridgeIp) {
        RestTemplate rt = new RestTemplate();
        String url = "http://" + bridgeIp + "/api";
        Map<String, String> body = Map.of("devicetype", "myhouse#server");
        try {
            ResponseEntity<String> resp = rt.postForEntity(url, body, String.class);
            JsonNode arr = objectMapper.readTree(resp.getBody());
            if (arr.isArray() && arr.size() > 0) {
                JsonNode first = arr.get(0);
                if (first.has("success")) {
                    return first.get("success").get("username").asText();
                }
                if (first.has("error")) {
                    String desc = first.get("error").get("description").asText();
                    throw new RuntimeException("Hue Bridge 오류: " + desc);
                }
            }
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new RuntimeException("Bridge 연결 실패: " + e.getMessage());
        }
        throw new RuntimeException("Bridge 응답을 파싱할 수 없습니다.");
    }

    // ── Bridge 연결 검증 ──────────────────────────────────────────────────────
    public boolean validateConnection(String bridgeIp, String hueUsername) {
        try {
            List<Map<String, Object>> lights = getLightsFromBridge(bridgeIp, hueUsername);
            return true; // 예외 없이 응답 오면 유효
        } catch (Exception e) {
            return false;
        }
    }

    // ── 조명 목록 조회 ────────────────────────────────────────────────────────
    // GET http://{bridgeIp}/api/{username}/lights
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLights(String email) {
        User user = getBridgeUser(email);
        return getLightsFromBridge(user.getHueBridgeIp(), user.getHueUsername());
    }

    private List<Map<String, Object>> getLightsFromBridge(String bridgeIp, String hueUsername) {
        RestTemplate rt = new RestTemplate();
        String url = "http://" + bridgeIp + "/api/" + hueUsername + "/lights";
        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(resp.getBody());

            // 오류 응답 체크 (배열이면 에러)
            if (root.isArray() && root.size() > 0 && root.get(0).has("error")) {
                String desc = root.get(0).get("error").get("description").asText();
                throw new UnauthorizedException("Hue Bridge 인증 실패: " + desc);
            }

            List<Map<String, Object>> result = new ArrayList<>();
            root.fields().forEachRemaining(entry -> {
                String lightId = entry.getKey();
                JsonNode light = entry.getValue();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("lightId",      lightId);
                item.put("name",         getTextSafe(light, "name"));
                item.put("type",         getTextSafe(light, "type"));
                item.put("modelid",      getTextSafe(light, "modelid"));
                item.put("manufacturer", getTextSafe(light, "manufacturername"));
                item.put("productname",  getTextSafe(light, "productname"));

                JsonNode state = light.get("state");
                if (state != null) {
                    item.put("on",          state.path("on").asBoolean(false));
                    item.put("brightness",  state.path("bri").asInt(0));   // 1-254
                    item.put("hue",         state.path("hue").asInt(0));   // 0-65535
                    item.put("saturation",  state.path("sat").asInt(0));   // 0-254
                    item.put("colorTemp",   state.path("ct").asInt(0));    // Mired (153-500)
                    item.put("reachable",   state.path("reachable").asBoolean(false));
                    item.put("colorMode",   getTextSafe(state, "colormode"));
                }

                // 기기 타입 분류
                item.put("deviceTypeIcon", resolveDeviceType(
                    getTextSafe(light, "type"),
                    getTextSafe(light, "productname"),
                    getTextSafe(light, "name")
                ));
                result.add(item);
            });
            return result;
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.error("Hue 조명 목록 조회 실패: {}", e.getMessage());
            throw new RuntimeException("Hue Bridge에 연결할 수 없습니다: " + e.getMessage());
        }
    }

    // ── 단일 조명 상태 조회 ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Object> getLightState(String email, String lightId) {
        User user = getBridgeUser(email);
        RestTemplate rt = new RestTemplate();
        String url = "http://" + user.getHueBridgeIp() + "/api/" + user.getHueUsername()
                   + "/lights/" + lightId;
        try {
            ResponseEntity<String> resp = rt.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode state = root.get("state");
            Map<String, Object> result = new LinkedHashMap<>();
            if (state != null) {
                result.put("on",         state.path("on").asBoolean(false));
                result.put("brightness", state.path("bri").asInt(0));
                result.put("hue",        state.path("hue").asInt(0));
                result.put("saturation", state.path("sat").asInt(0));
                result.put("colorTemp",  state.path("ct").asInt(0));
                result.put("reachable",  state.path("reachable").asBoolean(false));
                result.put("colorMode",  getTextSafe(state, "colormode"));
                result.put("name",       getTextSafe(root, "name"));
            }
            return result;
        } catch (Exception e) {
            log.warn("Hue 조명 상태 조회 실패 {}: {}", lightId, e.getMessage());
            return Collections.emptyMap();
        }
    }

    // ── 조명 제어 ─────────────────────────────────────────────────────────────
    // PUT http://{bridgeIp}/api/{username}/lights/{lightId}/state
    @Transactional(readOnly = true)
    public Map<String, Object> controlLight(String email, String lightId,
                                            Map<String, Object> stateBody) {
        User user = getBridgeUser(email);
        RestTemplate rt = new RestTemplate();
        String url = "http://" + user.getHueBridgeIp() + "/api/" + user.getHueUsername()
                   + "/lights/" + lightId + "/state";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<String> resp = rt.exchange(
                url, HttpMethod.PUT, new HttpEntity<>(stateBody, headers), String.class);
            JsonNode arr = objectMapper.readTree(resp.getBody());
            boolean success = arr.isArray() && arr.size() > 0 && arr.get(0).has("success");
            return Map.of("success", success, "response", resp.getBody());
        } catch (Exception e) {
            log.error("Hue 조명 제어 실패 {}: {}", lightId, e.getMessage());
            throw new RuntimeException("조명 제어 실패: " + e.getMessage());
        }
    }

    // ── 그룹(방) 제어 (전체 켜기/끄기) ──────────────────────────────────────
    // PUT http://{bridgeIp}/api/{username}/groups/0/action  (group 0 = all lights)
    @Transactional(readOnly = true)
    public Map<String, Object> controlGroup(String email, String groupId,
                                            Map<String, Object> actionBody) {
        User user = getBridgeUser(email);
        RestTemplate rt = new RestTemplate();
        String url = "http://" + user.getHueBridgeIp() + "/api/" + user.getHueUsername()
                   + "/groups/" + groupId + "/action";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<String> resp = rt.exchange(
                url, HttpMethod.PUT, new HttpEntity<>(actionBody, headers), String.class);
            return Map.of("success", true, "response", resp.getBody());
        } catch (Exception e) {
            throw new RuntimeException("그룹 제어 실패: " + e.getMessage());
        }
    }

    // ── 조명 → MyHouse 등록 정보 반환 ────────────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Object> getLightForImport(String email, String lightId) {
        List<Map<String, Object>> lights = getLights(email);
        return lights.stream()
                .filter(l -> lightId.equals(l.get("lightId")))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Hue에서 해당 조명을 찾을 수 없습니다."));
    }

    // ── 등록된 Hue 기기 상태 일괄 동기화 ─────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLightsWithLinked(String email, Long houseId,
            com.myhouse.repository.IotDeviceRepository iotRepo) {
        List<Map<String, Object>> lights = getLights(email);
        List<String> linked = iotRepo.findByHouseIdAndIsActiveTrue(houseId)
                .stream()
                .map(d -> d.getHueLightId())
                .filter(id -> id != null && !id.isEmpty())
                .collect(Collectors.toList());
        for (Map<String, Object> l : lights) {
            l.put("alreadyLinked", linked.contains(l.get("lightId")));
        }
        return lights;
    }

    // ── 기기 타입 분류 ────────────────────────────────────────────────────────
    private String resolveDeviceType(String type, String productName, String name) {
        String t = (type != null ? type : "").toLowerCase();
        String p = (productName != null ? productName : "").toLowerCase();
        String n = (name != null ? name : "").toLowerCase();

        // Hue type 문자열: "Extended color light", "Color temperature light",
        //  "Dimmable light", "On/Off plug-in unit", "Color light"
        if (t.contains("plug") || t.contains("outlet")) return "OTHER";
        if (p.contains("motion") || p.contains("sensor")) return "CAMERA";
        if (p.contains("dimmer") || p.contains("switch")) return "LIGHT";
        // 기본: 모두 조명
        return "LIGHT";
    }

    // ── 공통 유틸 ─────────────────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("사용자를 찾을 수 없습니다."));
    }

    private User getBridgeUser(String email) {
        User user = getUser(email);
        if (user.getHueBridgeIp() == null || user.getHueBridgeIp().isEmpty()) {
            throw new UnauthorizedException("Philips Hue Bridge가 연결되어 있지 않습니다.");
        }
        return user;
    }

    private String getTextSafe(JsonNode node, String field) {
        if (node == null) return "";
        JsonNode f = node.get(field);
        return (f != null && !f.isNull()) ? f.asText() : "";
    }
}
