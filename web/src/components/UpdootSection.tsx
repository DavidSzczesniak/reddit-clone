import { Flex, IconButton } from '@chakra-ui/core';
import React from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';

interface UpdootSectionProps {
    post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [, vote] = useVoteMutation();
    return (
        <Flex mr={4} alignItems="center" justifyContent="center" direction="column">
            <IconButton
                onClick={() => {
                    vote({
                        postId: post.id,
                        value: 1,
                    });
                }}
                icon="chevron-up"
                aria-label="Upvote post"
            />
            {post.points}
            <IconButton
                onClick={() => {
                    vote({
                        postId: post.id,
                        value: -1,
                    });
                }}
                icon="chevron-down"
                aria-label="Downvote post"
            />
        </Flex>
    );
};
