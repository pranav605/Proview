import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { AuthContext } from '@/contexts/authContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabaseClient';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, Minus, Search, SendHorizonal, ThumbsUp, TrendingDown, TrendingUp } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useContext, useEffect, useRef, useState } from 'react';

const { width } = Dimensions.get('window');

type Review = {
  id: string;
  product_id: string;
  given_by: string;
  text: string;
  vote_type: string;
  created_time: Date;
  upvote_count: number;
  downvote_count: number;
  profiles: {
    name: string;
    avatar_url: string;
  };
  isUpvoted: boolean;
};

type ReviewVote = {
  id: string;
  review_id: string;
  user_id: string;
  vote: 'up' | 'down';
  created_at: Date;

}

export type Chat = {
  id: string;
  queried_by: string;
  product_id?: string | null;
};

type VoteOption = 'worthit' | 'maybe' | 'skipit';

export default function ThreadScreen() {
  const params = useLocalSearchParams<{
    chatid: string;
    chatName?: string;
    chatData: any;
  }>();

  const vote_types = ['worthit', 'maybe', 'skipit']

  const chatid = Array.isArray(params.chatid) ? params.chatid[0] : params.chatid;
  const [chatData, setChatData] = useState<Chat | null>(null);
  const authContext = useContext(AuthContext);

  const colorScheme = useColorScheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewVotes, setReviewVotes] = useState<ReviewVote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newReview, setNewReview] = useState('');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isVerdictExpanded, setIsVerdictExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  const [voteType, setVoteType] = useState('');

  const animatedHeight = useRef(new Animated.Value(50)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      const { data, error } = await supabase.from('chats').select('id, queried_by, product_id').eq('id', chatid);
      if (error) {
        console.log(error);
      } else {
        setChatData(data[0]);
      }
    }
    fetchChatData();
  }, []);

  const votes = reviews.reduce(
  (acc, review) => {
    acc[review.vote_type as VoteOption] += 1;
    return acc;
  },
  { worthit: 0, maybe: 0, skipit: 0 } as Record<VoteOption, number>
);

  const hasReviewed = reviews.some(
    (r) => r.given_by === authContext.user?.id
  );


  useEffect(() => {
    if (chatData?.product_id)
      fetchReviews();
  }, [chatData])

  const fetchReviews = async () => {

    const { data, error } = await supabase.from('reviews').select('*, profiles:given_by (name, avatar_url)').eq('product_id', chatData?.product_id);
    if (error) {
      console.log(error);
    } else {
      if (data.length) {
        let reviewVote: ReviewVote[] = [];
        const promises = data.map(async (review) => {
          if (review.profiles?.avatar_url) {
            const { data } = supabase.storage
              .from('profile-images')
              .getPublicUrl(review.profiles.avatar_url);

            review.profiles = {
              ...review.profiles,
              avatar_url: data.publicUrl,
            };
          }

          const { data: fetchedVotes, error: reviewVotesError } = await supabase
            .from('review_votes')
            .select('*')
            .eq('user_id', authContext.user?.id)
            .eq('review_id', review.id);

          if (reviewVotesError) {
            console.log(reviewVotesError);
          } else if (fetchedVotes?.length > 0) {
            review.isUpvoted = fetchedVotes[0].vote === 'up';  // Fix: fetchedVotes[0], not data[0]
          } else {
            review.isUpvoted = false;
          }
          return review;
        });

        const enhancedReviews = await Promise.all(promises);  // Now fully resolved

        // console.log("Review vote:",reviewVote);

        // if (reviewVote.length > 0) {
        //   console.log("Enchanced Reviews:" ,enhancedReviews);
        //   setReviewVotes(reviewVote);
        // }
        console.log("Enchanced Reviews: ", enhancedReviews);

        setReviews(enhancedReviews);

      }
    }


  }

  const submitReview = async () => {
    const { data, error } = await supabase.from('reviews')
      .insert({ product_id: chatData?.product_id, given_by: authContext.user?.id, text: newReview.trim() })
      .select('id')
    if (error) {
      console.log(error);
    } else {
      console.log(data);
      setReviewId(data[0].id)
    }
  }

  const updateVote = async (option: VoteOption) => {
    const { data, error } = await supabase.from('reviews')
      .update({ vote_type: option })
      .eq('id', reviewId)
    if (error) {
      console.log(error);
    }
  }

  const submitUpVote = async (reviewId: string, currentUpvotes: number) => {
    if (!authContext.user?.id) return;

    const userId = authContext.user.id;

    const { data: existing, error: existingError } = await supabase
      .from('review_votes')
      .select('id, vote')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.log('review_votes fetch error:', existingError);
      return;
    }

    let newUpvotes = currentUpvotes;

    if (!existing) {

      const { error: insertError } = await supabase.from('review_votes').insert({
        review_id: reviewId,
        user_id: userId,
        vote: 'up',
      });
      if (insertError) {
        console.log('insert vote error:', insertError);
        return;
      }
      newUpvotes = currentUpvotes + 1;
    } else if (existing.vote === 'up') {

      const { error: deleteError } = await supabase
        .from('review_votes')
        .delete()
        .eq('id', existing.id);
      if (deleteError) {
        console.log('delete vote error:', deleteError);
        return;
      }
      newUpvotes = Math.max(0, currentUpvotes - 1);
    } else if (existing.vote === 'down') {

      const { error: updateError } = await supabase
        .from('review_votes')
        .update({ vote: 'up' })
        .eq('id', existing.id);
      if (updateError) {
        console.log('update vote error:', updateError);
        return;
      }

      newUpvotes = currentUpvotes + 1;
    }

    const { error: reviewError } = await supabase
      .from('reviews')
      .update({ upvote_count: newUpvotes })
      .eq('id', reviewId);

    if (reviewError) {
      console.log('update review error:', reviewError);
      return;
    }

    await fetchReviews();
  };


  const handleContentSizeChange = (event: any) => {
    const newHeight = Math.min(event.nativeEvent.contentSize.height + 20, 150);
    Animated.timing(animatedHeight, {
      toValue: newHeight,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmitReview = async () => {
    if (!newReview.trim() || isSubmitting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    // Simulate API call
    await submitReview();
    await fetchReviews();

    setNewReview('');
    setIsSubmitting(false);
    setShowVoteModal(true);

    // Scroll to top to show new review
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleVote = async (option: VoteOption) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateVote(option)
    setShowVoteModal(false);
  };

  const handleSkipVote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowVoteModal(false);
  };

  const handleUpvote = async (reviewId: string, upvote_count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await submitUpVote(reviewId, upvote_count);
    // setReviews((prev) =>
    //   prev.map((review) =>
    //     review.id === reviewId
    //       ? {
    //         ...review,
    //         upvote_count: review.isUpvoted ? review.upvote_count - 1 : review.upvote_count + 1,
    //         isUpvoted: !review.isUpvoted,
    //       }
    //       : review
    //   )
    // );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await fetchReviews();
    setIsRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatTimestamp = (reviewDate: Date) => {
    const date = new Date(reviewDate);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days == 1) return `Yesterday`;
    else if (days > 1 && days < 7) return `${days}d ago`;
    else if (days > 7) return `${date.toLocaleDateString()}`
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const filteredReviews = reviews.filter((review) =>
    review.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.profiles.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVotes = votes['worthit'] + votes['maybe'] + votes['skipit'];
  const maxBarWidth = width - 200;

  const renderBarChart = () => {
    const chartData: Array<{ label: string; count: number; color: string; icon: any }> = [
      { label: 'Worth It', count: votes['worthit'], color: '#32b48d', icon: TrendingUp },
      { label: 'Maybe', count: votes['maybe'], color: '#e68161', icon: Minus },
      { label: 'Skip It', count: votes['skipit'], color: '#c0152f', icon: TrendingDown },
    ];

    return (
      <View style={styles.barChartContainer}>
        <TouchableOpacity
          style={styles.chartHeader}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsVerdictExpanded(!isVerdictExpanded);
          }}
          activeOpacity={0.7}
          accessibilityLabel={`${isVerdictExpanded ? 'Collapse' : 'Expand'} community verdict`}
          accessibilityRole="button"
        >
          <ThemedText type="defaultSemiBold" style={styles.chartTitle}>
            Community Verdict
          </ThemedText>
          {isVerdictExpanded ? (
            <ChevronUp size={20} color={Colors[colorScheme ?? 'light'].text} />
          ) : (
            <ChevronDown size={20} color={Colors[colorScheme ?? 'light'].text} />
          )}
        </TouchableOpacity>

        {!isVerdictExpanded && (
          <View style={styles.compactView}>
            {chartData.map((item, index) => {
              const percentage = totalVotes > 0 ? (item.count / totalVotes) * 100 : 0;
              return (
                <View key={item.label} style={styles.compactItem}>
                  <View style={[styles.compactDot, { backgroundColor: item.color }]} />
                  <ThemedText style={styles.compactText}>
                    {percentage.toFixed(0)}%
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        {isVerdictExpanded && chartData.map((item, index) => {
          const percentage = totalVotes > 0 ? (item.count / totalVotes) * 100 : 0;
          const barWidth = totalVotes > 0 ? (item.count / totalVotes) * maxBarWidth : 0;
          const Icon = item.icon;

          return (
            <MotiView
              key={item.label}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              style={styles.barRow}
            >
              <View style={styles.barLabelContainer}>
                <Icon size={16} color={item.color} />
                <ThemedText style={styles.barLabel}>{item.label}</ThemedText>
              </View>
              <View style={styles.barWrapper}>
                <MotiView
                  from={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{ type: 'timing', duration: 800, delay: index * 100 }}
                  style={[styles.bar, { backgroundColor: item.color }]}
                />
                <ThemedText style={styles.barCount}>
                  {item.count} ({percentage.toFixed(0)}%)
                </ThemedText>
              </View>
            </MotiView>
          );
        })}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[
        styles.reviewCard,
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.avatarPlaceholder}>
          {item.profiles.avatar_url ? <Image
            source={{
              uri: item.profiles.avatar_url,
            }}
            alt="user"
            style={{ width: 40, height: 40, borderRadius: 25 }}
          />
            :
            <Text style={styles.avatarText}>{item.profiles.name[0].toUpperCase()}</Text>
          }
        </View>
        <View style={styles.reviewHeaderText}>
          <ThemedText type="defaultSemiBold">{item.profiles.name}</ThemedText>
          <ThemedText style={styles.timestamp}>{formatTimestamp(item.created_time)}</ThemedText>
        </View>
      </View>
      <ThemedText style={styles.reviewContent}>{item.text}</ThemedText>
      <View style={styles.reviewFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUpvote(item.id, item.upvote_count)}
          accessibilityLabel={`${item.isUpvoted ? 'Remove upvote' : 'Upvote'} this review`}
          accessibilityRole="button"
        >
          <ThumbsUp
            size={16}
            color={item.isUpvoted ? '#32b48d' : Colors[colorScheme ?? 'light'].text}
            fill={item.isUpvoted ? '#32b48d' : 'none'}
          />
          <ThemedText style={[styles.actionText, item.isUpvoted && { color: '#32b48d' }]}>
            {/* <ThemedText style={styles.actionText}> */}
            {item.upvote_count}
          </ThemedText>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.actionButton}
          accessibilityLabel={`View ${item.replies} replies`}
          accessibilityRole="button"
        >
          <MessageCircle size={16} color={Colors[colorScheme ?? 'light'].text} />
          <ThemedText style={styles.actionText}>{item.replies || 0}</ThemedText>
        </TouchableOpacity> */}
      </View>
    </MotiView>
  );

  const renderVoteModal = () => {
    if (!showVoteModal) return null;

    return (
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleSkipVote}
        accessibilityLabel="Close rating modal"
      >
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={styles.modalOverlayInner}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'timing', duration: 200 }}
              style={[
                styles.modalContent,
                { backgroundColor: Colors[colorScheme ?? 'light'].background }
              ]}
            >
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Rate This Product
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                Help others by sharing your verdict
              </ThemedText>

              <View style={styles.voteOptions}>
                <TouchableOpacity
                  style={[styles.voteButton, { borderColor: '#32b48d' }]}
                  onPress={() => handleVote('worthit')}
                  accessibilityLabel="Rate as Worth It"
                  accessibilityRole="button"
                >
                  <TrendingUp size={24} color="#32b48d" />
                  <ThemedText style={[styles.voteButtonText, { color: '#32b48d' }]}>
                    Worth It
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voteButton, { borderColor: '#e68161' }]}
                  onPress={() => handleVote('maybe')}
                  accessibilityLabel="Rate as Maybe"
                  accessibilityRole="button"
                >
                  <Minus size={24} color="#e68161" />
                  <ThemedText style={[styles.voteButtonText, { color: '#e68161' }]}>
                    Maybe
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.voteButton, { borderColor: '#c0152f' }]}
                  onPress={() => handleVote('skipit')}
                  accessibilityLabel="Rate as Skip It"
                  accessibilityRole="button"
                >
                  <TrendingDown size={24} color="#c0152f" />
                  <ThemedText style={[styles.voteButtonText, { color: '#c0152f' }]}>
                    Skip It
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSkipVote}
                style={styles.skipButton}
                accessibilityLabel="Skip rating"
                accessibilityRole="button"
              >
                <ThemedText style={styles.skipButtonText}>Skip for now</ThemedText>
              </TouchableOpacity>
            </MotiView>
          </TouchableOpacity>
        </MotiView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 90}
      >
        {/* Bar Chart */}
        {renderBarChart()}

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <Search size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search reviews..."
            placeholderTextColor="#888"
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            accessibilityLabel="Search reviews"
          />
        </View>

        {/* Reviews List */}
        <FlatList
          ref={flatListRef}
          data={filteredReviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          contentContainerStyle={styles.reviewsList}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>No reviews found</ThemedText>
            </View>
          }
        />

        {/* Input Bar */}
        {!hasReviewed && <View style={styles.inputWrapper}>
          <Animated.View style={[
            styles.inputContainer,
            {
              height: animatedHeight,
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: '#3d3f3e',
            }
          ]}>
            <View style={styles.row}>
              <TextInput
                value={newReview}
                onChangeText={setNewReview}
                placeholder="Share your review..."
                placeholderTextColor="#888"
                style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                returnKeyType="send"
                onSubmitEditing={handleSubmitReview}
                onContentSizeChange={handleContentSizeChange}
                multiline
                editable={!isSubmitting}
                accessibilityLabel="Write a review"
              />
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmitReview}
                disabled={isSubmitting || !newReview.trim()}
                accessibilityLabel="Submit review"
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
                ) : (
                  <SendHorizonal
                    color={newReview.trim() ? Colors[colorScheme ?? 'light'].tint : '#888'}
                    size={22}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>}
      </KeyboardAvoidingView>

      {/* Vote Modal */}
      {renderVoteModal()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  barChartContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
  },
  compactView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 6,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    height: 32,
    borderRadius: 6,
    minWidth: 2,
  },
  barCount: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3d3f3e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
  },
  reviewsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reviewCard: {
    paddingVertical: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#32b48d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewHeaderText: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  reviewContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  reviewFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  inputWrapper: {
    position: 'relative',
    bottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 50,
    margin: 16
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 150,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalOverlayInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: width - 48,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  voteOptions: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  voteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
