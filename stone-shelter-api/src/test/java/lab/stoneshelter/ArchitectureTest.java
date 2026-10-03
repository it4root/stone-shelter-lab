package lab.stoneshelter;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "lab.stoneshelter", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {
    @ArchTest
    static final ArchRule controllersDoNotAccessPersistence = noClasses()
            .that().resideInAPackage("lab.stoneshelter.api..")
            .should().dependOnClassesThat().resideInAPackage("lab.stoneshelter.persistence..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule entitiesStayInPersistence = classes()
            .that().areAnnotatedWith("jakarta.persistence.Entity")
            .should().resideInAPackage("lab.stoneshelter.persistence..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule domainDoesNotDependOnApi = noClasses()
            .that().resideInAPackage("lab.stoneshelter.domain..")
            .should().dependOnClassesThat().resideInAPackage("lab.stoneshelter.api..")
            .allowEmptyShould(true);
}
