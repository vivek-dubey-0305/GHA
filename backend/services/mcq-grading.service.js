export const normalizeAnswerMap = (answers = {}) => {
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
        return {};
    }

    return Object.entries(answers).reduce((acc, [key, value]) => {
        if (!key) return acc;
        acc[String(key)] = value;
        return acc;
    }, {});
};

const normalizeToken = (value = "") => String(value ?? "").trim();

const normalizeTokenLower = (value = "") => normalizeToken(value).toLowerCase();

const toUniqueTokenList = (value) => {
    const list = Array.isArray(value) ? value : [value];
    const cleaned = list
        .map((item) => normalizeToken(item))
        .filter(Boolean);

    return Array.from(new Set(cleaned));
};

const extractMcqCorrectAnswers = (question = {}) => {
    const fromArray = toUniqueTokenList(question.correctAnswers || []);
    if (fromArray.length > 0) return fromArray;
    const single = normalizeToken(question.correctAnswer);
    return single ? [single] : [];
};

const evaluateMcqQuestion = ({ question, chosen }) => {
    const marks = Math.max(Number(question?.marks || 1), 0);
    const options = toUniqueTokenList(question?.options || []);
    const correctList = extractMcqCorrectAnswers(question);
    const chosenList = toUniqueTokenList(chosen);

    if (marks <= 0 || correctList.length === 0) {
        return { earned: 0, total: marks };
    }

    // Single-correct MCQ uses exact matching for full marks.
    if (correctList.length === 1) {
        const isCorrect = chosenList.length === 1 && chosenList[0] === correctList[0];
        return {
            earned: isCorrect ? marks : 0,
            total: marks,
        };
    }

    // Multi-correct MCQ uses partial credit with wrong-pick penalty.
    const correctSet = new Set(correctList);
    const selectedSet = new Set(chosenList);
    let truePositives = 0;
    let falsePositives = 0;

    for (const item of selectedSet.values()) {
        if (correctSet.has(item)) truePositives += 1;
        else falsePositives += 1;
    }

    const denominator = Math.max(correctSet.size, 1);
    const raw = (truePositives - falsePositives) / denominator;
    const factor = Math.max(0, Math.min(raw, 1));

    return {
        earned: Math.round((marks * factor) * 100) / 100,
        total: marks,
        optionsCount: options.length,
    };
};

export const evaluateMcqAnswers = ({ questions = [], answers = {}, maxScore = 0 }) => {
    const normalizedAnswers = normalizeAnswerMap(answers);
    const safeQuestions = Array.isArray(questions) ? questions : [];

    let earned = 0;
    let total = 0;

    for (let index = 0; index < safeQuestions.length; index += 1) {
        const question = safeQuestions[index] || {};
        const questionId = String(question.questionId || index + 1);
        const result = evaluateMcqQuestion({
            question,
            chosen: normalizedAnswers[questionId],
        });

        total += result.total;
        earned += result.earned;
    }

    const boundedMax = Number(maxScore || total || 0);
    const denominator = total > 0 ? total : boundedMax;
    const computed = denominator > 0 ? (earned / denominator) * boundedMax : 0;

    return {
        score: Math.max(0, Math.round(computed * 100) / 100),
        maxScore: Math.max(0, boundedMax),
        totalQuestionMarks: total,
    };
};

export const evaluateTrueFalseAnswers = ({ questions = [], answers = {}, maxScore = 0 }) => {
    const normalizedAnswers = normalizeAnswerMap(answers);
    const safeQuestions = Array.isArray(questions) ? questions : [];

    let earned = 0;
    let total = 0;

    for (let index = 0; index < safeQuestions.length; index += 1) {
        const question = safeQuestions[index] || {};
        const questionId = String(question.questionId || index + 1);
        const marks = Math.max(Number(question.marks || 1), 0);
        const correct = normalizeTokenLower(question.correctAnswer);
        const chosen = normalizeTokenLower(normalizedAnswers[questionId]);

        total += marks;
        if (chosen && correct && chosen === correct) {
            earned += marks;
        }
    }

    const boundedMax = Number(maxScore || total || 0);
    const denominator = total > 0 ? total : boundedMax;
    const computed = denominator > 0 ? (earned / denominator) * boundedMax : 0;

    return {
        score: Math.max(0, Math.round(computed * 100) / 100),
        maxScore: Math.max(0, boundedMax),
        totalQuestionMarks: total,
    };
};

const normalizeMatchingAnswer = (answerValue) => {
    if (!answerValue) return {};
    if (typeof answerValue === "object" && !Array.isArray(answerValue)) {
        return Object.entries(answerValue).reduce((acc, [term, chosen]) => {
            const cleanTerm = normalizeToken(term);
            if (!cleanTerm) return acc;
            acc[cleanTerm] = normalizeToken(chosen);
            return acc;
        }, {});
    }
    return {};
};

export const evaluateMatchingAnswers = ({ questions = [], answers = {}, maxScore = 0 }) => {
    const normalizedAnswers = normalizeAnswerMap(answers);
    const safeQuestions = Array.isArray(questions) ? questions : [];

    let earned = 0;
    let total = 0;

    for (let index = 0; index < safeQuestions.length; index += 1) {
        const question = safeQuestions[index] || {};
        const questionId = String(question.questionId || index + 1);
        const marks = Math.max(Number(question.marks || 1), 0);
        const pairs = Array.isArray(question.pairs) ? question.pairs : [];
        const answerMap = normalizeMatchingAnswer(normalizedAnswers[questionId]);

        total += marks;
        if (pairs.length === 0) continue;

        const perPairMarks = marks / pairs.length;
        for (const pair of pairs) {
            const term = normalizeToken(pair?.term);
            const correctOption = normalizeToken(pair?.correctOption);
            if (!term || !correctOption) continue;
            const chosen = normalizeToken(answerMap[term]);
            if (chosen && chosen === correctOption) {
                earned += perPairMarks;
            }
        }
    }

    const boundedMax = Number(maxScore || total || 0);
    const denominator = total > 0 ? total : boundedMax;
    const computed = denominator > 0 ? (earned / denominator) * boundedMax : 0;

    return {
        score: Math.max(0, Math.round(computed * 100) / 100),
        maxScore: Math.max(0, boundedMax),
        totalQuestionMarks: total,
    };
};

export const evaluateObjectiveAnswers = ({ assessmentType = "mcq", questions = [], answers = {}, maxScore = 0 }) => {
    const type = String(assessmentType || "mcq").toLowerCase();
    if (type === "true_false") {
        return evaluateTrueFalseAnswers({ questions, answers, maxScore });
    }
    if (type === "matching") {
        return evaluateMatchingAnswers({ questions, answers, maxScore });
    }
    return evaluateMcqAnswers({ questions, answers, maxScore });
};
