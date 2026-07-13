import { useId, type ComponentType } from "react";
import {
  Clipboard,
  ClipboardCheck,
  Wallet,
  Banknote,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  Users,
  Briefcase,
  User,
  Link2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Scale,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Activity,
  CircleDollarSign,
  Video,
  Settings,
  LogOut,
  Check,
  Plus,
  Trash2,
  Upload,
  Download,
  FileText,
  Clock,
  CircleCheck,
  CircleAlert,
  Info,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  HardDriveUpload,
  type LucideProps,
} from "lucide-react";
import {
  SiDropbox,
  SiTiktok,
  SiFacebook,
  SiYoutube,
  SiX,
  SiThreads,
  type IconType,
} from "@icons-pack/react-simple-icons";

/**
 * Semantic wrapper around Lucide — every icon used across the app is
 * re-exported here under a project-meaningful name so call sites never
 * import "lucide-react" directly and a future icon swap stays a one-file
 * change. Defaults (size 20, strokeWidth 1.8) match the hand-drawn icon set
 * this replaced, so existing call sites need no prop changes.
 */
export type IconProps = LucideProps;

const defaults: LucideProps = { size: 20, strokeWidth: 1.8 };

function withDefaults(Icon: ComponentType<LucideProps>) {
  const Wrapped = (props: IconProps) => <Icon {...defaults} {...props} />;
  Wrapped.displayName = Icon.displayName ?? Icon.name;
  return Wrapped;
}

export const ClipboardIcon = withDefaults(Clipboard);
export const ClipboardCheckIcon = withDefaults(ClipboardCheck);
export const WalletIcon = withDefaults(Wallet);
export const BanknoteIcon = withDefaults(Banknote);
export const AlertTriangleIcon = withDefaults(AlertTriangle);
export const ShieldAlertIcon = withDefaults(ShieldAlert);
export const ShieldCheckIcon = withDefaults(ShieldCheck);
export const MegaphoneIcon = withDefaults(Megaphone);
export const UsersIcon = withDefaults(Users);
export const BriefcaseIcon = withDefaults(Briefcase);
export const UserIcon = withDefaults(User);
export const LinkIcon = withDefaults(Link2);
export const EyeIcon = withDefaults(Eye);
export const EyeOffIcon = withDefaults(EyeOff);

export const DashboardIcon = withDefaults(LayoutDashboard);
export const DisputeIcon = withDefaults(Scale);
export const BellIcon = withDefaults(Bell);
export const MenuIcon = withDefaults(Menu);
export const CloseIcon = withDefaults(X);
export const ChevronDownIcon = withDefaults(ChevronDown);
export const ChevronStartIcon = withDefaults(ChevronLeft);
export const ChevronEndIcon = withDefaults(ChevronRight);
export const SearchIcon = withDefaults(Search);
export const FilterIcon = withDefaults(Filter);
export const TrendingUpIcon = withDefaults(TrendingUp);
export const AnalyticsIcon = withDefaults(BarChart3);
export const ActivityIcon = withDefaults(Activity);
export const RevenueIcon = withDefaults(CircleDollarSign);
export const VideoIcon = withDefaults(Video);
export const SettingsIcon = withDefaults(Settings);
export const LogOutIcon = withDefaults(LogOut);
export const CheckIcon = withDefaults(Check);
export const PlusIcon = withDefaults(Plus);
export const TrashIcon = withDefaults(Trash2);
export const UploadIcon = withDefaults(Upload);
export const DownloadIcon = withDefaults(Download);
export const FileTextIcon = withDefaults(FileText);
export const ClockIcon = withDefaults(Clock);
export const CircleCheckIcon = withDefaults(CircleCheck);
export const CircleAlertIcon = withDefaults(CircleAlert);
export const InfoIcon = withDefaults(Info);
export const ArrowStartIcon = withDefaults(ArrowRight);
export const ArrowEndIcon = withDefaults(ArrowLeft);
export const ArrowUpRightIcon = withDefaults(ArrowUpRight);
export const DeviceUploadIcon = withDefaults(HardDriveUpload);

/** Real brand marks (official logo colors) for the cloud-storage source pickers. */
function withBrandColor(Icon: IconType) {
  const Wrapped = ({
    size = 20,
    ...props
  }: {
    className?: string;
    size?: string | number;
  }) => <Icon color="default" size={size} {...props} />;
  Wrapped.displayName = Icon.displayName;
  return Wrapped;
}

export const DropboxIcon = withBrandColor(SiDropbox);
export const TikTokIcon = withBrandColor(SiTiktok);
export const FacebookIcon = withBrandColor(SiFacebook);
export const YouTubeIcon = withBrandColor(SiYoutube);
export const XIcon = withBrandColor(SiX);
export const ThreadsIcon = withBrandColor(SiThreads);

/** Official Instagram gradient glyph (Meta brand resource center). */
export function InstagramIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: string | number;
}) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 680 680"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Instagram"
    >
      <defs>
        <radialGradient
          id={`${id}-a`}
          cx="1270.13"
          cy="541.97"
          r="47.48"
          gradientTransform="matrix(-8.8 2.48 1.79 6.35 10873.12 -6274.96)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ff005f" />
          <stop offset="1" stopColor="#fc01d8" />
        </radialGradient>
        <radialGradient
          id={`${id}-b`}
          cx="1160.06"
          cy="706.17"
          r="47.48"
          gradientTransform="matrix(0 -11.43 -12.13 0 8745.01 13994.49)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fc0" />
          <stop offset=".12" stopColor="#fc0" />
          <stop offset=".57" stopColor="#fe4a05" />
          <stop offset=".69" stopColor="#ff0f3f" />
          <stop offset="1" stopColor="#fe0657" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${id}-c`}
          cx="1091.2"
          cy="772.79"
          r="58.95"
          gradientTransform="rotate(120 -992.7 3554.6) scale(-3.81 4.96)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fc0" />
          <stop offset="1" stopColor="#fc0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${id}-a)`}
        d="M340.05 0v.1c-13.94 0-16.6.03-28.67.03-58.69.12-81.03.53-111.63 1.89-36.17 1.61-60.9 7.4-82.55 15.74-22.32 8.75-41.28 20.32-60.24 39.16s-30.52 37.82-39.26 60.3C9.23 138.87 3.58 163.5 1.97 199.7.45 234 .04 250.8 0 329.76v10.14l.02 13.98c.06 74.4.46 92.72 1.95 126.28 1.61 36.2 7.4 60.96 15.73 82.5 8.74 22.33 20.3 41.3 39.26 60.28s37.92 30.55 60.24 39.3c21.64 8.34 46.38 14.13 82.55 15.74 36.28 1.61 47.9 2.02 140.13 2.02h.24c92.17 0 103.82-.4 140.09-2.02 36.16-1.61 60.9-7.4 82.55-15.74 22.32-8.75 41.28-20.32 60.23-39.3 18.96-18.84 30.52-37.81 39.26-60.29 8.34-21.66 14.12-46.3 15.73-82.5C679.6 443.84 680 432.24 680 340v-.19c0-92.13-.4-103.92-2.02-140.1-1.74-36.2-7.4-60.96-15.73-82.49-8.74-22.34-20.3-41.31-39.26-60.29s-37.78-30.54-60.23-39.16C541.1 9.42 516.37 3.63 480.2 2.02 443.79.41 432.3 0 340.05 0m-30.6 61.23h30.53c90.75 0 101.5.27 137.4 2.02 33.21 1.48 51.1 7 63.2 11.7 15.86 6.2 27.15 13.6 39.12 25.44s19.23 23.28 25.41 39.16c4.7 11.98 10.22 30.01 11.7 63.12 1.61 35.8 2.02 46.56 2.02 137.4 0 90.83-.4 101.47-2.02 137.4-1.48 33.1-7 51.14-11.7 63.11-6.18 15.88-13.58 27.19-25.41 39.03-11.97 11.84-23.26 19.24-39.12 25.43-11.97 4.71-29.99 10.23-63.2 11.71-35.9 1.62-46.65 2.02-137.4 2.02-90.76 0-101.51-.4-137.41-2.02-33.2-1.48-51.1-7.13-63.2-11.7-15.86-6.2-27.15-13.6-39.12-25.44s-19.22-23.15-25.4-39.03c-4.71-11.97-10.22-30-11.7-63.11-1.62-35.8-2.02-46.57-2.02-137.4s.27-101.47 2.02-137.4c1.48-33.1 6.99-51.14 11.7-63.12 6.18-15.88 13.57-27.18 25.4-39.16 11.97-11.84 23.26-19.24 39.13-25.43 11.96-4.71 29.98-10.23 63.19-11.71 31.46-1.61 43.56-2.02 106.89-2.02m212.03 56.52a40.73 40.73 0 0 0-40.73 40.78 40.73 40.73 0 1 0 81.48 0 40.73 40.73 0 0 0-40.75-40.78m-181.5 47.64c-96.4 0-174.65 78.19-174.65 174.68s78.25 174.67 174.65 174.67 174.65-78.18 174.65-174.67c0-96.5-78.25-174.68-174.65-174.68m0 61.37c62.65 0 113.34 50.73 113.34 113.3s-50.69 113.32-113.34 113.32-113.34-50.74-113.34-113.31 50.82-113.31 113.34-113.31"
      />
      <path
        fill={`url(#${id}-b)`}
        d="M311.75.1C253.06.23 230.73.63 200.12 2c-36.17 1.61-60.9 7.4-82.55 15.74C95.25 26.5 76.29 38.06 57.33 56.9c-18.95 18.84-30.52 37.82-39.26 60.3-8.47 21.67-14.11 46.3-15.73 82.5-.93 95.92-4.77 171.55 0 280.44 1.62 36.2 7.4 60.97 15.74 82.5 8.73 22.34 20.3 41.31 39.25 60.29 18.96 18.97 37.92 30.55 60.24 39.3 21.64 8.34 46.38 14.12 82.55 15.74 36.28 1.61 47.9 2.02 140.13 2.02h.25c92.16 0 103.8-.4 140.08-2.02 36.17-1.62 60.9-7.4 82.55-15.75 22.32-8.74 41.28-20.32 60.24-39.3 18.95-18.83 30.52-37.8 39.26-60.28 8.33-21.67 14.11-46.3 15.73-82.5.69-97.2.43.8 0-280.45-1.75-36.2-7.4-60.96-15.73-82.5-8.74-22.33-20.3-41.3-39.26-60.28-18.96-18.97-37.78-30.55-60.24-39.16C541.5 9.4 516.75 3.61 480.58 2 399.62-.64 378.56.09 311.75.1m-1.92 61.1c56.8.05 122.76-.16 167.93 2.03 33.2 1.48 51.09 7 63.19 11.7 31.51 13.43 53.13 35.84 64.53 64.6 4.71 11.98 10.22 30.01 11.7 63.11 2.17 100.42 4.53 173.53 0 274.8-1.48 33.1-6.99 51.14-11.7 63.12-6.18 15.88-13.58 27.18-25.4 39.02-11.97 11.85-23.27 19.25-39.13 25.44-11.97 4.71-29.98 10.23-63.2 11.7-35.9 1.62-46.65 2.03-137.4 2.03s-101.51-.4-137.4-2.02c-33.22-1.48-51.1-7.13-63.2-11.71-15.86-6.2-27.16-13.6-39.12-25.44-11.97-11.84-19.23-23.14-25.41-39.02-4.71-11.98-10.22-30.01-11.7-63.12-1.97-100.24-4.87-173.76 0-274.8 1.48-33.1 6.99-51.13 11.7-63.11 6.18-15.88 13.58-27.18 25.4-39.16 11.97-11.84 23.27-19.25 39.13-25.44 11.97-4.7 29.98-10.22 63.2-11.7 31.45-1.62 43.55-2.02 106.88-2.02m30.52 104.17c-96.4 0-174.65 78.18-174.65 174.67 0 96.5 78.25 174.68 174.65 174.68S515 436.53 515 340.04s-78.25-174.67-174.65-174.67m0 61.36c62.65 0 113.34 50.74 113.34 113.31S403 453.36 340.35 453.36s-113.34-50.74-113.34-113.32 50.82-113.3 113.34-113.3"
      />
      <path
        fill={`url(#${id}-c)`}
        d="M340.05 0v.1c-13.94 0-16.6.03-28.67.03-58.69.12-81.03.53-111.63 1.89-36.17 1.61-60.9 7.4-82.55 15.74-22.32 8.75-41.28 20.32-60.24 39.16s-30.52 37.82-39.26 60.3C9.23 138.87 3.58 163.5 1.97 199.7.45 234 .04 250.8 0 329.76v10.14l.02 13.98c.06 74.4.46 92.72 1.95 126.28 1.61 36.2 7.4 60.96 15.73 82.5 8.74 22.33 20.3 41.3 39.26 60.28s37.92 30.55 60.24 39.3c21.64 8.34 46.38 14.13 82.55 15.74 36.28 1.61 47.9 2.02 140.13 2.02h.24c92.17 0 103.82-.4 140.09-2.02 36.16-1.61 60.9-7.4 82.55-15.74 22.32-8.75 41.28-20.32 60.23-39.3 18.96-18.84 30.52-37.81 39.26-60.29 8.34-21.66 14.12-46.3 15.73-82.5C679.6 443.84 680 432.24 680 340v-.19c0-92.13-.4-103.92-2.02-140.1-1.74-36.2-7.4-60.96-15.73-82.49-8.74-22.34-20.3-41.31-39.26-60.29s-37.78-30.54-60.23-39.16c-21.65-8.34-46.39-14.13-82.55-15.74C443.79.41 432.3 0 340.05 0m-30.6 61.23h30.53c90.75 0 101.5.27 137.4 2.02 33.21 1.48 51.1 7 63.2 11.7 31.51 13.43 53.13 35.84 64.53 64.6 4.7 11.98 10.22 30.01 11.7 63.12 1.61 35.8 2.02 46.56 2.02 137.4 0 90.83-.4 101.47-2.02 137.4-1.48 33.1-7 51.14-11.7 63.11-6.18 15.88-13.58 27.19-25.41 39.03-11.97 11.84-23.26 19.24-39.12 25.43-11.97 4.71-29.99 10.23-63.2 11.71-35.9 1.62-46.65 2.02-137.4 2.02-90.76 0-101.51-.4-137.41-2.02-33.2-1.48-51.1-7.13-63.2-11.7-15.86-6.2-27.15-13.6-39.12-25.44s-19.22-23.15-25.4-39.03c-4.71-11.97-10.22-30-11.7-63.11-1.62-35.8-2.02-46.57-2.02-137.4s.27-101.47 2.02-137.4c1.48-33.1 6.99-51.14 11.7-63.12 6.18-15.88 13.57-27.18 25.4-39.16 11.97-11.84 23.26-19.24 39.13-25.43 11.96-4.71 29.98-10.23 63.19-11.71 31.46-1.61 43.56-2.02 106.89-2.02m30.53 104.16c-96.4 0-174.65 78.19-174.65 174.68s78.25 174.67 174.65 174.67 174.65-78.18 174.65-174.67c0-96.5-78.25-174.68-174.65-174.68m0 61.37c62.65 0 113.34 50.73 113.34 113.3s-50.69 113.32-113.34 113.32-113.34-50.74-113.34-113.31 50.82-113.31 113.34-113.31"
      />
    </svg>
  );
}

/** Current Google Drive mark (redesigned May 2026), from Google's own Workspace brand source. */
export function GoogleDriveIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: string | number;
}) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 741.3696"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Google Drive"
    >
      <mask
        id={`${id}-mask`}
        maskUnits="userSpaceOnUse"
        x="12"
        y="18"
        width="168"
        height="154"
      >
        <path
          fill="#fff"
          d="M63.09 37c14.626-25.333 51.193-25.334 65.819 0l45.033 78c14.626 25.334-3.657 57.001-32.91 57.001H50.967c-29.253 0-47.536-31.667-32.91-57.001Z"
        />
      </mask>
      <g
        mask={`url(#${id}-mask)`}
        transform="matrix(4.8140532,0,0,4.8140532,-62.146701,-86.652356)"
      >
        <path
          fill={`url(#${id}-b)`}
          d="M206.905 172.02h-91.888l-19.015-32.934 45.944-79.578Z"
        />
        <path
          fill={`url(#${id}-c)`}
          d="M-14.919 172.006 50.04 59.494v.002L31.032 92.422h38.02L115 172.004l-129.918.001Z"
        />
        <path
          fill={`url(#${id}-d)`}
          d="M96.007-20.085 141.954 59.5l-19.011 32.928H31.048Z"
        />
      </g>
      <defs>
        <linearGradient
          id={`${id}-b`}
          x1="193.6"
          x2="103.09"
          y1="165.6"
          y2="111.21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".09" stopColor="#ffe921" />
          <stop offset="1" stopColor="#fec700" />
        </linearGradient>
        <linearGradient
          id={`${id}-c`}
          x1="114.4"
          x2="15.53"
          y1="181.61"
          y2="121.8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".15" stopColor="#a9a8ff" />
          <stop offset=".33" stopColor="#6d97ff" />
          <stop offset=".48" stopColor="#3186ff" />
        </linearGradient>
        <linearGradient
          id={`${id}-d`}
          x1="128.88"
          x2="28.7"
          y1="37.88"
          y2="84.64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".55" stopColor="#0ebc5f" />
          <stop offset=".85" stopColor="#78c9ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OneDriveIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: string | number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 5.5 32 20.5"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="OneDrive"
    >
      <path
        fill="#0364b8"
        d="M12.20245,11.19292l.00031-.0011,6.71765,4.02379,4.00293-1.68451.00018.00068A6.4768,6.4768,0,0,1,25.5,13c.14764,0,.29358.0067.43878.01639a10.00075,10.00075,0,0,0-18.041-3.01381C7.932,10.00215,7.9657,10,8,10A7.96073,7.96073,0,0,1,12.20245,11.19292Z"
      />
      <path
        fill="#0078d4"
        d="M12.20276,11.19182l-.00031.0011A7.96073,7.96073,0,0,0,8,10c-.0343,0-.06805.00215-.10223.00258A7.99676,7.99676,0,0,0,1.43732,22.57277l5.924-2.49292,2.63342-1.10819,5.86353-2.46746,3.06213-1.28859Z"
      />
      <path
        fill="#1490df"
        d="M25.93878,13.01639C25.79358,13.0067,25.64764,13,25.5,13a6.4768,6.4768,0,0,0-2.57648.53178l-.00018-.00068-4.00293,1.68451,1.16077.69528L23.88611,18.19l1.66009.99438,5.67633,3.40007a6.5002,6.5002,0,0,0-5.28375-9.56805Z"
      />
      <path
        fill="#28a8ea"
        d="M25.5462,19.18437,23.88611,18.19l-3.80493-2.2791-1.16077-.69528L15.85828,16.5042,9.99475,18.97166,7.36133,20.07985l-5.924,2.49292A7.98889,7.98889,0,0,0,8,26H25.5a6.49837,6.49837,0,0,0,5.72253-3.41556Z"
      />
    </svg>
  );
}
