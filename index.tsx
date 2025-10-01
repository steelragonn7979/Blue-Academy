/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {GoogleGenAI} from '@google/genai';

interface Flashcard {
  term: string;
  definition: string;
}

const suggestionsContainer = document.getElementById(
  'suggestionsContainer',
) as HTMLDivElement;
const generateButton = document.getElementById(
  'generateButton',
) as HTMLButtonElement;
const flashcardsContainer = document.getElementById(
  'flashcardsContainer',
) as HTMLDivElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
const courseInfoForm = document.getElementById('courseInfoForm') as HTMLFormElement;
const userEmail = document.getElementById('userEmail') as HTMLInputElement;
const userPhone = document.getElementById('userPhone') as HTMLInputElement;
const formSuccessMessage = document.getElementById('formSuccessMessage') as HTMLDivElement;


const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
let selectedTopic = '';

const suggestions = [
  'Lập ngân sách',
  'Tiết kiệm & Đầu tư',
  'Quản lý nợ',
  'Điểm tín dụng',
  'Bảo hiểm',
  'Thuế thu nhập cá nhân',
  'Lập kế hoạch nghỉ hưu',
  'Cổ phiếu và Trái phiếu',
  'Quỹ tương hỗ & ETF',
  'Lạm phát và Lãi suất',
  'Đầu tư Bất động sản',
  'Tiền điện tử',
  'Quản lý rủi ro đầu tư',
  'Phân tích Kỹ thuật',
  'Tài chính Hành vi',
  'Lập kế hoạch Di sản',
  'Tự do Tài chính',
  'Kinh tế học cho Nhà đầu tư',
  'Các loại Lệnh giao dịch',
  'Đa dạng hóa Danh mục',
];

// Disable the generate button initially
generateButton.disabled = true;

// Create suggestion chips
suggestions.forEach((topic) => {
  const chip = document.createElement('button');
  chip.className = 'suggestion-chip';
  chip.textContent = topic;
  chip.dataset.topic = topic;
  suggestionsContainer.appendChild(chip);

  chip.addEventListener('click', () => {
    // Clear active state from all other chips
    document
      .querySelectorAll('.suggestion-chip')
      .forEach((c) => c.classList.remove('active'));
    // Set active state on the clicked chip
    chip.classList.add('active');
    // Store the selected topic
    selectedTopic = chip.dataset.topic || '';
    // Enable the generate button
    generateButton.disabled = false;
  });
});

generateButton.addEventListener('click', async () => {
  const topic = selectedTopic;
  if (!topic) {
    errorMessage.textContent =
      'Vui lòng chọn một chủ đề để tạo thẻ.';
    flashcardsContainer.textContent = '';
    return;
  }

  errorMessage.textContent = 'Đang tạo thẻ tài chính...';
  errorMessage.classList.add('loading');
  flashcardsContainer.textContent = '';
  generateButton.disabled = true; // Disable button during generation

  try {
    const prompt = `Tạo một danh sách các thẻ học tài chính bằng tiếng Việt cho chủ đề "${topic}". Mỗi thẻ cần có một thuật ngữ và một định nghĩa ngắn gọn, dễ hiểu về tài chính cá nhân bằng tiếng Việt. Định dạng đầu ra dưới dạng danh sách các cặp "Thuật ngữ: Định nghĩa", mỗi cặp trên một dòng mới. Đảm bảo thuật ngữ và định nghĩa riêng biệt và được phân tách rõ ràng bằng một dấu hai chấm duy nhất. Ví dụ:
    Lạm phát: Sự tăng mức giá chung của hàng hóa và dịch vụ theo thời gian, làm giảm sức mua của một đơn vị tiền tệ.
    Lãi suất kép: Lãi được tính trên cả vốn gốc ban đầu và lãi tích lũy từ các kỳ trước.`;
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    // Use optional chaining and nullish coalescing for safer access
    const responseText = result?.text ?? '';

    if (responseText) {
      const flashcards: Flashcard[] = responseText
        .split('\n')
        // Improved splitting and filtering
        .map((line) => {
          const parts = line.split(':');
          // Ensure there's a term and at least one part for definition
          if (parts.length >= 2 && parts[0].trim()) {
            const term = parts[0].trim();
            const definition = parts.slice(1).join(':').trim(); // Join remaining parts for definition
            if (definition) {
              return {term, definition};
            }
          }
          return null; // Return null for invalid lines
        })
        .filter((card): card is Flashcard => card !== null); // Filter out nulls and type guard

      if (flashcards.length > 0) {
        errorMessage.textContent = '';
        errorMessage.classList.remove('loading');
        flashcards.forEach((flashcard, index) => {
          // Create card structure for flipping
          const cardDiv = document.createElement('div');
          cardDiv.classList.add('flashcard');
          cardDiv.dataset['index'] = index.toString();
          cardDiv.setAttribute('aria-label', `Thẻ học cho ${flashcard.term}. Nhấn để lật.`);
          cardDiv.setAttribute('role', 'button');
          cardDiv.tabIndex = 0;


          const cardInner = document.createElement('div');
          cardInner.classList.add('flashcard-inner');

          const cardFront = document.createElement('div');
          cardFront.classList.add('flashcard-front');

          const termDiv = document.createElement('div');
          termDiv.classList.add('term');
          termDiv.textContent = flashcard.term;

          const cardBack = document.createElement('div');
          cardBack.classList.add('flashcard-back');

          const definitionDiv = document.createElement('div');
          definitionDiv.classList.add('definition');
          definitionDiv.textContent = flashcard.definition;

          cardFront.appendChild(termDiv);
          cardBack.appendChild(definitionDiv);
          cardInner.appendChild(cardFront);
          cardInner.appendChild(cardBack);
          cardDiv.appendChild(cardInner);

          flashcardsContainer.appendChild(cardDiv);

          const flipCard = () => cardDiv.classList.toggle('flipped');

          // Add click listener to toggle the 'flipped' class
          cardDiv.addEventListener('click', flipCard);
          cardDiv.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              flipCard();
            }
          });
        });
      } else {
        errorMessage.textContent =
          'Không thể tạo thẻ ghi nhớ hợp lệ từ phản hồi. Vui lòng kiểm tra lại định dạng.';
        errorMessage.classList.remove('loading');
      }
    } else {
      errorMessage.textContent =
        'Không thể tạo thẻ ghi nhớ hoặc nhận được phản hồi trống. Vui lòng thử lại.';
      errorMessage.classList.remove('loading');
    }
  } catch (error: unknown) {
    console.error('Error generating content:', error);
    const detailedError =
      (error as Error)?.message || 'Đã xảy ra lỗi không xác định';
    errorMessage.textContent = `Đã xảy ra lỗi: ${detailedError}`;
    errorMessage.classList.remove('loading');
    flashcardsContainer.textContent = ''; // Clear cards on error
  } finally {
    // Re-enable button if a topic is still selected
    if (selectedTopic) {
      generateButton.disabled = false;
    }
  }
});

courseInfoForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Prevent actual form submission

  const submitButton = document.getElementById('submitCourseInfo') as HTMLButtonElement;
  const originalButtonText = 'Nhận thông tin khóa học';
  const email = userEmail.value;
  
  // Basic validation
  if (!email || !email.includes('@')) {
    userEmail.focus();
    // Maybe add a visual shake or error border to the input
    return;
  }

  // 1. Loading state
  submitButton.disabled = true;
  submitButton.classList.add('sending');

  // Simulate network request
  setTimeout(() => {
    // 2. Success state
    submitButton.classList.remove('sending');
    submitButton.classList.add('success');
    submitButton.textContent = '✓ Gửi thành công!';
    
    formSuccessMessage.classList.add('visible');
    
    userEmail.value = '';
    userPhone.value = '';

    // 3. Reset after a few seconds
    setTimeout(() => {
      submitButton.classList.remove('success');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      formSuccessMessage.classList.remove('visible');
    }, 3000);

  }, 1500);
});