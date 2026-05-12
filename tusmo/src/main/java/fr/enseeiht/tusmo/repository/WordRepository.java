package fr.enseeiht.tusmo.repository;

import fr.enseeiht.tusmo.entity.Word;
import fr.enseeiht.tusmo.entity.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    List<Word> findByDifficulte(Difficulty difficulte);
    List<Word> findByLongueur(int longueur);
    
    @Query(value = "SELECT * FROM words ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Word> findRandomWord();
}
