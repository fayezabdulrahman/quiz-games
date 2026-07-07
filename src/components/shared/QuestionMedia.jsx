export default function QuestionMedia({ media = [], className = '' }) {
  const images = (Array.isArray(media) ? media : []).filter(
    (item) => item?.type === 'image' && item.src,
  )

  if (!images.length) return null

  return (
    <div className={`question-media ${images.length > 1 ? 'multi' : 'single'} ${className}`.trim()}>
      {images.map((item, index) => (
        <figure key={`${item.src}-${index}`}>
          <img src={item.src} alt={item.alt || `Question image ${index + 1}`} loading="lazy" />
        </figure>
      ))}
    </div>
  )
}
