import React, { useState, useEffect } from 'react';
import { Article, AppMode } from '../../types';
import { getEditorialPhoto } from '../../config/photos';
import { ThemedCardBanner } from './ThemedCardBanner';

export function CardImage({
  article,
  mode,
}: {
  article: Article;
  mode: AppMode;
}) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (article.img && !article.img.startsWith('data:image/svg+xml;utf8')) {
      return article.img;
    }
    return getEditorialPhoto(article.primaryCat, article.title, mode);
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (article.img && !article.img.startsWith('data:image/svg+xml;utf8')) {
      setImgSrc(article.img);
      setHasError(false);
    } else {
      setImgSrc(getEditorialPhoto(article.primaryCat, article.title, mode));
      setHasError(false);
    }
  }, [article.img, article.primaryCat, article.title, mode]);

  const handleError = () => {
    const fallbackPhoto = getEditorialPhoto(article.primaryCat, article.title, mode);
    if (imgSrc !== fallbackPhoto) {
      setImgSrc(fallbackPhoto);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <ThemedCardBanner
        category={article.primaryCat}
        title={article.title}
        mode={mode}
        source={article.src}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className="ci"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}
