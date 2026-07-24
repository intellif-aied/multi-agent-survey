document.querySelectorAll('[data-quiz]').forEach((quiz) => {
  const feedback = quiz.querySelector('[data-feedback]');
  quiz.querySelectorAll('button[data-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      const correct = button.dataset.correct === 'true';
      quiz.querySelectorAll('button[data-answer]').forEach((item) => {
        item.classList.remove('correct', 'wrong');
      });
      button.classList.add(correct ? 'correct' : 'wrong');
      feedback.className = `feedback ${correct ? 'correct' : 'wrong'}`;
      feedback.textContent = correct
        ? quiz.dataset.correctFeedback
        : quiz.dataset.wrongFeedback;
    });
  });
});
