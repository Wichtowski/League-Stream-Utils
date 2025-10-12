import { BsCameraFill } from "react-icons/bs";
import { BsCameraVideoFill } from "react-icons/bs";
import { TbChairDirector } from "react-icons/tb";
import { SiCodingninjas } from "react-icons/si";
import { FaGlobe, FaLink, FaLinkSlash } from "react-icons/fa6";

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'twitch' | 'youtube' | 'obs' | 'direct' | 'vdo' | 'other' | 'configuring' | 'invalid';
}
  
export const validateStreamUrl = (url: string): UrlValidationResult => {
if (!url || url.trim() === '') {
    return { isValid: false, error: 'URL is required' };
}

const trimmedUrl = url.trim();

// Basic URL format validation
try {
    new URL(trimmedUrl);
} catch {
    return { isValid: false, error: 'Not a valid link', type: 'invalid' };
}

// Twitch validation
if (trimmedUrl.includes('twitch.tv') || trimmedUrl.includes('player.twitch.tv')) {
    if (trimmedUrl.includes('player.twitch.tv')) {
    return { isValid: true, type: 'twitch' };
    }
    return { isValid: true, type: 'twitch' };
}

// YouTube validation
if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    if (trimmedUrl.includes('/embed/') || trimmedUrl.includes('youtube.com/watch')) {
    return { isValid: true, type: 'youtube' };
    }
    return { isValid: true, type: 'youtube' };
}

// OBS/RTMP validation
if (trimmedUrl.startsWith('rtmp://') || trimmedUrl.startsWith('rtmps://')) {
    return { isValid: true, type: 'obs' };
}

// Direct video stream validation
if (trimmedUrl.includes('.m3u8') || trimmedUrl.includes('.mp4') || trimmedUrl.includes('.webm')) {
    return { isValid: true, type: 'direct' };
}

// VDO Ninja validation
if (trimmedUrl.includes('vdo.ninja')) {
    return { isValid: true, type: 'vdo' };
}

  // Generic HTTPS/HTTP validation
  if (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://')) {
    return { isValid: true, type: 'other' };
  }

  return { isValid: false, error: 'Invalid URL format', type: 'invalid' };
};


export const getStreamTypeIcon = (type?: string): React.ComponentType<{ className?: string }> => {
switch (type) {
    case 'twitch':
    return BsCameraFill;
    case 'youtube':
    return BsCameraVideoFill;
    case 'obs':
    return TbChairDirector;
    case 'direct':
    return SiCodingninjas;
    case 'vdo':
    return FaLink;
    case 'configuring':
    return FaGlobe;
    case 'invalid':
    return FaLinkSlash;
    default:
    return FaGlobe;
}
};

export const getStreamTypeLabel = (type?: string): string => {
    switch (type) {
        case 'twitch':
        return 'Twitch';
        case 'youtube':
        return 'YouTube';
        case 'obs':
        return 'OBS/RTMP';
        case 'direct':
        return 'Direct Video';
        case 'vdo':
        return 'VDO Ninja';
        case 'configuring':
        return 'Configuring';
        case 'invalid':
        return 'Invalid Link';
        default:
        return 'Other';
    }
};