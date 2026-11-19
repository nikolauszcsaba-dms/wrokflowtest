const Avatar = ({ url, size }) => (
    <span className={size === 'large' ? 'avatar avatar-large' : 'avatar'} aria-hidden="true">
        {url ? (
            <img src={url} alt="" />
        ) : (
            <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.6-3.6 4.4-5.5 8-5.5S18.4 16.4 20 20" />
            </svg>
        )}
    </span>
);

export default Avatar;
