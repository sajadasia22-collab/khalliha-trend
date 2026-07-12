import type { ComponentType } from "react";
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
  type LucideProps,
} from "lucide-react";

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
