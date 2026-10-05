package lab.stoneshelter.mappers.entities;

public abstract class AbstractEntityMapper<S, T> {
    public final T toEntity(S source) {
        if (source == null) {
            return null;
        }
        var entity = newEntity();
        populateEntity(source, entity);
        return entity;
    }

    public final T replace(T entity, S source) {
        if (source == null) {
            return null;
        }
        if (entity == null) {
            throw new IllegalArgumentException("Target entity must not be null.");
        }
        populateEntity(source, entity);
        return entity;
    }

    protected abstract T newEntity();

    protected abstract void populateEntity(S source, T entity);
}
