package lab.stoneshelter.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lab.stoneshelter.entities.StoneChatTurnEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional
public class StoneChatContextSelector {
    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    @Transactional(readOnly = true)
    public List<StoneChatTurnEntity> select(List<StoneChatTurnEntity> turns) {
        List<StoneChatTurnEntity> selected = new ArrayList<>(turns.subList(Math.max(0, turns.size() - 10), turns.size()));
        long characters = selected.stream().mapToLong(turn -> representation(turn).length()).sum();
        while (characters > 20_000 && !selected.isEmpty()) characters -= representation(selected.removeFirst()).length();
        return List.copyOf(selected);
    }
    public String representation(StoneChatTurnEntity turn) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("message", turn.getMessage()); values.put("context", turn.getContext());
        values.put("text", turn.getText()); values.put("stones", turn.getStones());
        return jsonMapper.writeValueAsString(values);
    }
}
