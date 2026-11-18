const sourceImages = import.meta.glob('../data/Original data/*/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export type SourceImageStatus = 'loading' | 'loaded' | 'error';

const imageStatusCache = new Map<string, SourceImageStatus>();
const inFlightLoads = new Map<string, Promise<SourceImageStatus>>();

export interface QuestionSourceImages {
  questionImage?: string;
  answerKeyImage?: string;
}

export function getQuestionSourceImages(
  subject: string,
  questionId: string,
): QuestionSourceImages {
  const imagePrefix = subject === 'Biology' ? 'BIO' : 'CHEM';
  const questionNumber = questionId.split('_')[1]?.padStart(4, '0');
  if (!questionNumber) {
    return {};
  }

  return {
    questionImage:
      sourceImages[
        `../data/Original data/${imagePrefix}_q/${imagePrefix}_${questionNumber}_question.jpg`
      ],
    answerKeyImage:
      sourceImages[
        `../data/Original data/${imagePrefix}_a/${imagePrefix}_${questionNumber}_key.jpg`
      ],
  };
}

export function getCachedSourceImageStatus(src: string): SourceImageStatus {
  return imageStatusCache.get(src) ?? 'loading';
}

export function markSourceImageStatus(src: string, status: SourceImageStatus): void {
  imageStatusCache.set(src, status);
}

export function preloadSourceImage(src: string): Promise<SourceImageStatus> {
  const cached = imageStatusCache.get(src);
  if (cached === 'loaded' || cached === 'error') {
    return Promise.resolve(cached);
  }

  const existing = inFlightLoads.get(src);
  if (existing) {
    return existing;
  }

  const promise = new Promise<SourceImageStatus>((resolve) => {
    const img = new Image();
    img.decoding = 'async';

    let settled = false;
    const finish = (status: SourceImageStatus) => {
      if (settled) return;
      settled = true;
      imageStatusCache.set(src, status);
      inFlightLoads.delete(src);
      resolve(status);
    };

    const handleLoaded = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(
          () => finish('loaded'),
          () => finish('loaded'),
        );
      } else {
        finish('loaded');
      }
    };

    img.onload = handleLoaded;
    img.onerror = () => finish('error');
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      handleLoaded();
    }
  });

  inFlightLoads.set(src, promise);
  return promise;
}
