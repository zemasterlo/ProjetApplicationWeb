package fr.enseeiht.tusmo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RoundHintDTO {
    private Long roundId;
    private int numeroRound;
    private char premiereLettre;
    private int longueurMot;
}
