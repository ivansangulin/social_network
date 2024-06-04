import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isYesterday,
} from "date-fns";

export const calculateAwayTime = (last_active: Date) => {
  const now = new Date();
  const diffYears = differenceInYears(now, last_active);
  const diffMonths = differenceInMonths(now, last_active);
  const diffDays = differenceInDays(now, last_active);
  const diffHours = differenceInHours(now, last_active);
  const diffMinutes = differenceInMinutes(now, last_active);

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 31) {
    return `${diffDays}d`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mth`;
  } else {
    return `${diffYears}y`;
  }
};

export const calculateTime = (date: Date) => {
  const now = new Date();

  const diffHours = differenceInHours(now, date);
  const diffMinutes = differenceInMinutes(now, date);
  const diffDays = differenceInDays(now, date);

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 && "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 && "s"} ago`;
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 && "s"} ago`;
  } else {
    return date.toLocaleDateString();
  }
};
