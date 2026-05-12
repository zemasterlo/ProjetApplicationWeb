package fr.enseeiht.tusmo.loader;

import fr.enseeiht.tusmo.entity.Difficulty;
import fr.enseeiht.tusmo.entity.Word;
import fr.enseeiht.tusmo.repository.WordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DictionaryLoader implements CommandLineRunner {

    @Autowired
    private WordRepository wordRepository;

    @Override
    @Override
    public void run(String... args) throws Exception {
        if (wordRepository.count() > 0) {
            System.out.println("Le dictionnaire est déjà rempli !");
            return;
        }

        InputStream is = getClass().getResourceAsStream("/Lexique4.tsv");
        if (is == null) {
            System.out.println("Erreur : Fichier Lexique4.tsv introuvable !");
            return;
        }

        List<Word> motsAAjouter = new ArrayList<>();
        Set<String> motsExistants = new HashSet<>();

        BufferedReader reader = new BufferedReader(
            new InputStreamReader(is, StandardCharsets.UTF_8)
        );

        String ligne;
        boolean isPremiereLigne = true;

        while ((ligne = reader.readLine()) != null) {
            if (isPremiereLigne) { isPremiereLigne = false; continue; }

            String[] colonnes = ligne.split("\t");
            if (colonnes.length > 14) {
                String mot = colonnes[0].trim();
                String type = colonnes[4].trim();
                String estLemme = colonnes[13].trim();

                if (type.equals("NOM") && estLemme.equals("1")
                        && mot.matches("^[a-zA-ZÀ-ÿ]+$")) {

                    int longueur = mot.length();
                    if (longueur >= 5 && longueur <= 8) {
                        String motMajuscule = mot.toUpperCase();

                        if (motsExistants.add(motMajuscule)) {
                            Difficulty diff = longueur <= 5 ? Difficulty.EASY
                                            : longueur <= 7 ? Difficulty.MEDIUM
                                            : Difficulty.HARD;

                            Word w = new Word();
                            w.setMot(motMajuscule);
                            w.setLongueur(longueur);
                            w.setDifficulte(diff);
                            motsAAjouter.add(w);

                            if (motsAAjouter.size() >= 500) {
                                wordRepository.saveAll(motsAAjouter);
                                motsAAjouter.clear();
                            }
                        }
                    }
                }
            }
        }

        reader.close();

        if (!motsAAjouter.isEmpty()) {
            wordRepository.saveAll(motsAAjouter); 
        }
        System.out.println("Chargement terminé !");
    }
}
