import type { QuestionType } from '@prisma/client';

type ScoreInput = {
    questionType: QuestionType;
    effectiveScore?: number | null;
    defaultScore?: number | null;
    selectedAnswer: any;      // Json bentuk fleksibel
    options?: any;            // untuk TKP: bobot
    correctAnswer?: any;      // TIU/TWK: kunci
};

export function scoreOneAnswer(input: ScoreInput) {
    const { questionType, effectiveScore, defaultScore, selectedAnswer, options, correctAnswer } = input;

    let obtained = 0;

    if (questionType === 'TKP') {
        // Contoh opsi TKP: { A: 1, B: 3, C: 5, D: 2, E: 4 }
        const optKey = (selectedAnswer?.option ?? '').toString();
        const weight = options?.[optKey];
        obtained = Number.isFinite(weight) ? Number(weight) : 0;
    } else {
        // TIU/TWK
        const isCorrect =
            JSON.stringify(selectedAnswer) === JSON.stringify(correctAnswer) ||
            selectedAnswer?.option === correctAnswer?.option; // dukung bentuk {option:'B'}
        if (isCorrect) obtained = (effectiveScore ?? defaultScore ?? 0);
    }

    return {
        obtainedScore: obtained,
        normalizedAnswerJson: selectedAnswer ?? null
    };
}
